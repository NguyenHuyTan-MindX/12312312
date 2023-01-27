const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
var User = require('../Model/User')
var Govt = require('../Model/Government_Registrar')
var sms = require('../Api/send_sms')
var mail = require('../Api/send_mail')

router.post('/signup', async (req, res) => {
  const { email, name, contact, address, city, postalCode } = req.body
  console.log(req.body)
  try {
    let user = await User.findOne({
      email,
    })
    if (user) {
      return res.status(400).json({
        message: 'User Already Exists',
      })
    }

    user = new User({
      email,
      name,
      contact,
      address,
      city,
      postalCode,
    })

    await user.save()
    res.status(200).send('Thanks for registering!')
  } catch (err) {
    console.log(err.message)
    res.status(500).send('Error in Saving')
  }
})

router.post('/register_govt', async (req, res) => {
  /* Giải thích
  Khi người dùng gọi API đăng ký sẽ gửi request lên và dữ liệu trong form từ frontend gửi lên
  sẽ ở trong body lên sẽ dùng destructoring để bóc tác phần tử lấy dữ liệu gán vào Schema và gửi lên trên database .
  - Lưu ý khi làm việc với database bất kể là database gì cũng đều phải xử lý async / await =>
  Phỏng vấn nó sẽ hỏi vì sao lại phải async / await khi xử lý với database trả lời là: vì khi server kết nối tới 1 bên thứ 3 nào đó , đều cần 1 khoản thời gian nên cần phải xử lý bđb chỗ này để có kết quả rồi mới chạy tiếp code logic phía sau.
  */
  const { username, password, address, contact, city } = req.body
  // Insert details straight into MongoDB
  try {
    // gán phần từ bóc tác từ req.body trả về define Model của mongo
    const username = "Tannguyen";
    const password = "123";
    const address = "93, TranThanhTong , TanBinh";
    const contact = "01123392027"
    const city = "HoChiMinh"
    let user = new Govt({
      username: username,
      password: password,
      address: address,
      contact: contact,
      city: city,
    })
    // Phần này là mã hóa password có thẻ tìm hiểu thêm thư viện bscrypt
    const salt = await bcrypt.genSalt(10)
    user.password = bcrypt.hashSync(password, salt) // chỗ này dùng hàm hashSync để nó chạy bất đồng bộ hoặc await nếu dùng hash (cũng đéo vấn đề gì cả)
    await user.save()
    res.status(200).send({
      user_regiter: user,
      message: 'Thanks for registering!'
    }
    )
  } catch (err) {
    console.log(err.message)
    res.status(500).send('Error in Saving')
  }
});

router.post('/login', async (req, res) => {
  /* Giải thích
  - Khi người dùng gửi request từ form frontend lên sẽ nhận từ req.body
  
  */
  const { username, password } = req.body
  try {
    let user = await Govt.findOne({ // tìm kiếm username có tên nhận từ req
      username: username,
    })

    if (!user) {
      // đéo có thì báo là ko tồn tại
      return res.status(400).json({
        message: 'User Not Exist',
      })
    } else {
      // có gì chạy so sánh mật khẩu từ là nó sẽ mã hóa và so sánh với chuỗi đã mã hóa lúc trước thằng user đăng ký nếu khớp thì báo là có, ko khớp thì gửi response là ko đúng
      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch)
        return res.status(400).json({
          message: 'Incorrect Password !',
        })
      var payload = { user: user }
      // console.log(payload);
      // chỗ token này là nó sẽ mã hóa theo 1 field chỉ định, thường thì là email, password hay cái j cũng được miễn thuộc user đó đang có.
      var token = jwt.sign(payload, 'login successfull')

      console.log(user)
      res.status(200).send({
        userLogin: user,
        AccessToken: token
      })
      // res.send('Login Successfully')

    }

  } catch (e) {
    console.error(e)
    res.status(500).json({
      message: 'Server Error',
    })
  }
})

router.post('/send_mail', async (req, res) => {
  const { lemail, message, subject, number } = req.body
  mail.send_mail(lemail, message, subject)
  sms.send_sms(number, message)
  res.status(200).send('Mail Sent!')
})

module.exports = router

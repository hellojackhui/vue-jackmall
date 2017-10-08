var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Goods = require('../models/goods');

//连接MongoDB数据库
mongoose.connect('mongodb://127.0.0.1:27017/jackmall');
mongoose.connection.on("connected",function () {
  console.log("MongoDB connected success.")
});
mongoose.connection.on("error",function () {
  console.log("MongoDB connected fail.")
});
mongoose.connection.on("disconnected",function () {
  console.log("MongoDB connected disconnected.")
});

//查询商品列表数据
router.get("/list",function (req,res,next) {
  let page =parseInt(req.param("page"));
  let pageSize = parseInt(req.param("pageSize"));
  let priceLevel = req.param("priceLevel");
  let sort = req.param("sort");
  let skip = (page-1)*pageSize;
  var priceGt = '',priceLte='';
  let params = {};
  if(priceLevel!='all'){
    switch (priceLevel){
      case '0':priceGt=0;priceLte=100;break;
      case '1':priceGt=100;priceLte=500;break;
      case '2':priceGt=500;priceLte=1000;break;
      case '3':priceGt=1000;priceLte=5000;break;
    }
    params = {
      salePrice:{
        $gt:priceGt,
        $lte:priceLte
      }
    }
  }

  let goodsModel = Goods.find(params).skip(skip).limit(pageSize);
  goodsModel.sort({'salePrice':sort});
  goodsModel.find(function (err,doc) {
    if(err){
      res.json({
        status:'1',
        msg:err.message
      });
    }else {
      res.json({
        status:'0',
        msg:'',
        result:{
          count:doc.length,
          list:doc
        }
      })
    }
  })
});

router.post("/addCart", function (req,res,next) {
   var userId = '100000077',productId = req.body.productId;  //post请求取参用req.body
   var User = require('../models/user'); //获取这个模型
    User.findOne({userId:userId}, function (err,userDoc) {//两个回调，第一个是有没有报错，第二个是数据
        if(err){
            res.json({
                status:"1",
                msg:err.message
            })
          }else{  //拿到用户信息之后
            console.log("userDoc:"+userDoc);
            if(userDoc){
               var goodsItem = '';
                userDoc.cartList.forEach(function (item) {  //看购物车里面是不是已经有这样商品了，如果有就直接更改数量，不要增加购物车条目了
                    if(item.productId == productId){
                        goodsItem = item; //保存goodsItem，留给下面做判断
                        item.productNum ++;
                      }
                  });
               if(goodsItem){  //goodsItem有值，则为true，即购物车里已经有这商品了
                    userDoc.save(function (err2,doc2) {
                        if(err2){
                            res.json({
                                status:"1",
                               msg:err2.message
                            })
                          }else{
                            res.json({
                                status:'0',
                                msg:'',
                                result:'suc'
                            })
                          }
                      })
                  }else{  //goodsItem没值，则为false，即购物车里还没有这商品
                    //查询一下商品存不存在，存在的话再进行下一步操作
                      Goods.findOne({productId:productId}, function (err1,doc) {
                          if(err1){
                              res.json({
                                  status:"1",
                                  msg:err1.message
                              })
                            }else{
                              if(doc){
                                  doc.productNum = 1;
                                  doc.checked = 1;
                                  userDoc.cartList.push(doc); //直接push就添加进去了，简直可怕
                                  userDoc.save(function (err2,doc2) { //保存文档
                                      if(err2){
                                          res.json({
                                              status:"1",
                                              msg:err2.message
                                          })
                                        }else{
                                          res.json({
                                              status:'0',
                                              msg:'',
                                              result:'suc'
                                          })
                                        }
                                    })
                                }
                            }
                        });
                  }
              }
          }
      })
  });
module.exports = router;  //不输出的话，在app.js里面是拿不到这个模块的


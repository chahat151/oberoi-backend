const Stat = require("./../models/statSchema");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const handleFactory = require("./handleFactory");

exports.getAllStats = handleFactory.getAll(Stat);
exports.getStat = handleFactory.getOne(Stat);
exports.createStat = handleFactory.createOne(Stat);
exports.updateStat = handleFactory.updateOne(Stat);
exports.deleteStat = handleFactory.deleteOne(Stat);

exports.getLatestStat = catchAsync(async (req, res, next) => {
  const stat = await Stat.findOne().sort({ createdAt: -1 });
  return res.status(200).json({
    data: stat
  });
});
// exports.createStats = catchAsync(async(req, res, next)=>{

//   // Add emails to Stat database
//   return res.status(200).json({
//     data: ''
//   })
// })

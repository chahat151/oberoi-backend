const { Schema, model } = require("mongoose");

const statSchema = new Schema(
  {
    arrival: String,
    departure: String,
    eod: String,
    occupancy: String,
    wordOfTheWeek: String,
    knowTourHotel: [String],
    focusOfTheWeek: String,
    revenuePerRoom: String,
    avgRoomRate: String,
    netPromoterScore: String
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

const Stat = model("Stat", statSchema);

module.exports = Stat;

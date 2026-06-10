import mongoose from "mongoose";
import { Schema } from "mongoose";


const subcriptionschema = new Schema ({
    subcription :
     {
        type : Schema.ObjectId,
        ref :"User"
     },
     channel :{
        type : Schema.ObjectId,
        ref :"User"
     }
     },{
        timestamps :true
     }

)


export const subcription = mongoose.model("subscription", subcriptionschema)
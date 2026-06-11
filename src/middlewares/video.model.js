
import mongoose,{Schema} from "mongoose";

const videoSchema =new Schema (
    { 
        videoFile :{
        type :String,
        required :true
    },
     thumbnail:{
        type :String,
        required :true
    },
     title:{
        type :String,
        required :true
    },
     describtion :{
        type :String,
        required :true
    },
     duration :{
        type :Number,
        required :true
    },
     views :{
        type :String,
        default :0 ,
    },
     isPublish:{
        type :Boolean,
         default:true,
    },
    owner :{
        type :Schema.Types.ObjectId,
        ref :"user"
    }

}
,{timestamp :true ,}
)

videoSchema.plugin(mongooseAggregatepaginate)

export const  video = mongoose.model("video",videoSchema)
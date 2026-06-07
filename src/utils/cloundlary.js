import { v2 as cloudinary } from 'cloudinary';
 import fs from "fs" ;

    // Configuration
    cloudinary.config({ 
        cloud_name: 'CLOUNDIARY_CLOUND_NAME', 
        api_key:'CLOUNDIARY_CLOUND_KEY' , 
        api_secret: 'CLOUNDIARY_CLOUND_SECRET' // Click 'View API Keys' above to copy your API secret
    });
    
    // Upload an image
     const uploardCloundinary= async (localfilepath) => {
        try {
            if (!localfilepath)
             return null
            const respons = await  cloudinary.uploader.upload(localfilepath , {
                resource_type: "auto"
            } )
            console.log("file is uploaded on cloundary", 
                respons.url
            ) ;
             return respons;
             
        } catch (error) {
            fs.unlinkSync(localfilepath) ;return null ;
        }
     }
    export {uploardCloundinary}
    

    
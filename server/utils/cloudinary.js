import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

 cloudinary.config({ 
        cloud_name: 'dzflvvule', 
        api_key: '836873821745775', 
        api_secret: 'YOK6JrUVCC_mWsYAjteQ0dZiXrI' // Click 'View API Keys' above to copy your API secret
    });
    
    const uploadOnCloudinary= async function(localfilepath){

        try{
            if(!localfilepath) return null
            //upload file on cloudinary
             const uploadResult = await cloudinary.uploader
             .upload(localfilepath,{
               resource_type:"auto"
         })
         console.log("File uploaded Successfully on ")
         console.log(uploadResult)
         return uploadResult;
    
       

        }catch(error){

            // if file not uploaded then it is important to remove file from locally ssasved temporary files
            fs.unlinkSync(localfilepath)
            return null

        }

    }
    
    
export  {uploadOnCloudinary}

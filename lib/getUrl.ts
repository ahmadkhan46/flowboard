import { storage } from "@/appwrite"

const getUrl = async (image: Image) => {
    const url = storage.getFileView(image.bucketID, image.fieldID)
    return url;
}

export default getUrl

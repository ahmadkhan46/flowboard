import { ID, storage } from "@/appwrite"

const uploadImage = async (file: File, permissions?: string[]) => {
    if(!file) return;
    const bucketId = process.env.NEXT_PUBLIC_IMAGES_BUCKET_ID;
    if (!bucketId) {
        throw new Error("Missing NEXT_PUBLIC_IMAGES_BUCKET_ID environment variable.");
    }

    const fileUploaded = await storage.createFile(
        bucketId,
        ID.unique(),
        file,
        permissions
    )
    return fileUploaded;
}

export default uploadImage

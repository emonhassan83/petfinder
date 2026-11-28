import { instance } from "@/helpers/axios/axiosInstance";
import { API_URL } from "@/lib/apiData";

//* Uploads one image through the API (POST /media/upload, multipart field `file`; signed Cloudinary
//* upload on the server). Returns the hosted URL. Throws with the API message on failure
//* (503 when media storage is not configured, 400 for unsupported/oversized files).
const uploadImage = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append("file", file);
  try {
    //* the instance unwraps the envelope to { data, meta }
    const res: any = await instance.post(`${API_URL}/media/upload`, form);
    const url = res?.data?.url;
    if (!url) throw new Error("Upload failed");
    return url;
  } catch (err: any) {
    throw new Error(err?.response?.data?.message || err?.message || "Upload failed");
  }
};

export default uploadImage;

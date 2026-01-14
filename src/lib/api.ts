// Use environment variable for API URL, fallback to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface UploadResponse {
  status: string;
  data: {
    original_image_url: string;
    corrected_image_url: string;
    necrosis_class: number;
    brightness: number;
  };
  message: string;
}

export interface DiagnosisRecord {
  id: string;
  created_at: string;
  user_id: string;
  image_url: string;
  diagnosis: string;
  description: string;
  risk_level: number;
  brightness: number;
  sacs_grade?: number;
  advice?: string;
  emergency_alert?: string;
}

export async function uploadImage(imageBlob: Blob, userId: string = "anonymous"): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", imageBlob, "stoma_image.jpg");
  formData.append("user_id", userId);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  console.log("Response received from backend:", response);
  const result = await response.json();

  // Check if backend returned an error
  if (result.status === "error") {

    throw new Error(result.message || "Backend error occurred");
  }

  return result;
}

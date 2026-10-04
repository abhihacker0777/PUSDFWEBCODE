import { Readable } from "node:stream";
import { getServiceDrive } from "./googleAuth";

const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID;

export async function uploadBufferToGoogleDrive({
  buffer,
  fileName,
  mimeType,
}: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}): Promise<{ fileId: string; webViewLink: string; webContentLink?: string }> {
  const drive = await getServiceDrive();

  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const fileMetadata: any = {
    name: fileName,
  };

  if (DRIVE_FOLDER_ID) {
    fileMetadata.parents = [DRIVE_FOLDER_ID];
  }

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: {
      mimeType: mimeType || "application/pdf",
      body: stream,
    },
    fields: "id, name, webViewLink, webContentLink",
  });

  const fileId = response.data.id;
  if (!fileId) {
    throw new Error("Failed to receive Google Drive file ID.");
  }

  // Grant public read permission to the file
  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
  } catch (permError) {
    console.warn("Could not set anyone/reader permission on Drive file:", permError);
  }

  const webViewLink = response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
  const webContentLink = response.data.webContentLink || undefined;

  return {
    fileId,
    webViewLink,
    webContentLink,
  };
}

export async function deleteDriveFile(fileId: string): Promise<boolean> {
  if (!fileId) return false;
  try {
    const drive = await getServiceDrive();
    await drive.files.delete({ fileId, supportsAllDrives: true });
    return true;
  } catch (error) {
    console.error("Failed to delete Google Drive file:", fileId, error);
    return false;
  }
}


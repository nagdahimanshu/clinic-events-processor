import { Router } from "express";
import { UploadController } from "../controllers/upload";
import { streamingUpload } from "../middleware/streamingUpload";

const router = Router();
const uploadController = new UploadController();

router.post(
  "/upload",
  streamingUpload,
  uploadController.upload.bind(uploadController),
);

export default router;

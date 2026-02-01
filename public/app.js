const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const statusDiv = document.getElementById("status");
const fileInfoDiv = document.getElementById("fileInfo");

// Click to browse
uploadArea.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    handleFile(file);
  }
});

// Drag and drop
uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => {
  uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file && file.name.endsWith(".csv")) {
    fileInput.files = e.dataTransfer.files;
    handleFile(file);
  } else {
    showStatus("Please select a CSV file", "error");
  }
});

function handleFile(file) {
  if (!file.name.endsWith(".csv")) {
    showStatus("Only CSV files allowed", "error");
    return;
  }

  showFileInfo(file);
  uploadFile(file);
}

function showFileInfo(file) {
  const sizeKB = (file.size / 1024).toFixed(2);
  fileInfoDiv.style.display = "block";
  fileInfoDiv.textContent = `${file.name} (${sizeKB} KB)`;
}

// Upload file
async function uploadFile(file) {
  uploadArea.classList.add("uploading");
  showStatus("Uploading...", "info");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      showStatus(
        "Upload done! Processing started. Check Slack for updates.",
        "success",
      );
      fileInput.value = "";
      fileInfoDiv.style.display = "none";
    } else {
      showStatus(`Error while uploading file: ${result.error}`, "error");
    }
  } catch (error) {
    showStatus(`Error while uploading file: ${error.message}`, "error");
  } finally {
    uploadArea.classList.remove("uploading...");
  }
}

function showStatus(message, type) {
  statusDiv.style.display = "block";
  statusDiv.className = `status ${type}`;
  statusDiv.textContent = message;
}

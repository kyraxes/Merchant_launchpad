export function compressImage(file: File, forMenu = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Unable to decode image"));
      image.onload = () => {
        function render(maxEdge: number, quality: number) {
          const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Unable to prepare image");
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL("image/jpeg", quality);
        }

        try {
          const target = forMenu ? 680_000 : 1_200_000;
          let output = render(forMenu ? 1600 : 960, forMenu ? 0.82 : 0.68);
          if (output.length > target) output = render(forMenu ? 1200 : 800, 0.56);
          if (output.length > target) output = render(forMenu ? 960 : 640, 0.48);
          if (output.length > (forMenu ? 700_000 : 1_600_000)) throw new Error("Image remains too large");
          resolve(output);
        } catch (error) {
          reject(error);
        }
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

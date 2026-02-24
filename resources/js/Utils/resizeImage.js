const resizeImage = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const max = 1000;
                let { width, height } = img;

                if (width > height) {
                    if (width > max) {
                        height *= max / width;
                        width = max;
                    }
                } else {
                    if (height > max) {
                        width *= max / height;
                        height = max;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    const resizedFile = new File([blob], file.name, { type: file.type });
                    resolve(resizedFile);
                }, file.type);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
};

export default resizeImage
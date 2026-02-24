class Clipboard {
    static copy = (string, callback = () => { }, fallback = () => { }) => {
        navigator.clipboard.writeText(string)
            .then(callback)
            .catch(fallback)
    }

    static paste(pseudo, callback = () => { }, attrs = {}) {
        const element = typeof pseudo === "string" ? document.querySelector(pseudo) : pseudo;

        const defaultAttrs = {};
        for (let key in attrs) {
            let value = element.getAttribute(key);
            defaultAttrs[key] = value;
        }

        function handlePaste(event) {
            let files = event.clipboardData.files;
            if (files.length) {
                event.preventDefault();
                let fileList = [];
                for (let i = 0; i < files.length; i++) {
                    fileList.push(files.item(i));
                }
                callback(fileList);
            } else {
                callback(null);
            }
        }

        function handleDrop(event) {
            event.preventDefault();
            leave();
            let value = element.value;
            element.value = value + event.dataTransfer.getData("text");
            if (event.dataTransfer.items) {
                var items = [...event.dataTransfer.items];
                if (items.length == 0) {
                    callback(null);
                    return;
                }
                items = items.filter((item) => item.kind === "file");
                if (items.length == 0) {
                    callback(null);
                    return;
                }
                callback(items.map((item) => item.getAsFile()));
            } else {
                callback([...event.dataTransfer.files]);
            }
        }

        function handleDragOver(event) {
            event.preventDefault();
            over();
        }

        function handleDragLeave(event) {
            event.preventDefault();
            leave();
        }

        function over() {
            for (let i in attrs) {
                try {
                    element.setAttribute(i, attrs[i]);
                } catch (error) {
                    console.warn(error);
                }
            }
        }

        function leave() {
            for (let i in defaultAttrs) {
                try {
                    element.setAttribute(i, defaultAttrs[i]);
                } catch (error) {
                    console.warn(error);
                }
            }
        }

        element.addEventListener("paste", handlePaste);
        element.addEventListener("drop", handleDrop);
        element.addEventListener("dragover", handleDragOver);
        element.addEventListener("dragleave", handleDragLeave);
    }
}

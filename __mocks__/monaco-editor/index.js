window.TextEncoder = class TextEncoder {
    encode() {
        return new Uint8Array([]);
    }
}

window.HTMLCanvasElement.prototype.getContext = () => {}
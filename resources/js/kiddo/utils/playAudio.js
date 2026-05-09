export const playAudio = (path) => {
    if (!path) return;
    const audio = new Audio(path);
    audio.play().catch((error) => {
        console.error(
            "Audio playback failed. Make sure the file exists at:",
            path,
        );
    });
};

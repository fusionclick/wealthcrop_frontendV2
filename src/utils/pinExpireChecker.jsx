
export const isPinExpired = () => {
    const expiry = localStorage.getItem("pin_expiry")

    if(!expiry) return null;
    return Date.now() > Number(expiry)
}
import { Avatar } from "@mui/material";
import { useEffect, useState } from "react";
import { getProfileImage } from "../../api/userProfileApi";

/**
 * Avatar that automatically uses a member's uploaded profile photo.
 * Falls back to initials when no photo exists or the image cannot be loaded.
 */
export default function MemberAvatar({
  userId,
  name,
  hasProfileImage,
  sx,
  ...props
}) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    setSrc("");

    if (!userId || hasProfileImage === false) {
      return () => {};
    }

    getProfileImage(userId)
      .then((url) => {
        if (active) {
          objectUrl = url;
          setSrc(url);
        } else if (url) {
          URL.revokeObjectURL(url);
        }
      })
      .catch(() => {
        // A 404 simply means this member has no uploaded photo.
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [userId, hasProfileImage]);

  const displayName = name || "User";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Avatar
      {...props}
      src={src || undefined}
      alt={displayName}
      sx={sx}
    >
      {initials || "U"}
    </Avatar>
  );
}

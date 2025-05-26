import React from 'react';

const UserAvatar = ({ initials = "DB" }) => { // Default initials
  return (
    <div className="user-avatar" title="User Profile">
      {initials}
    </div>
  );
};

export default UserAvatar;
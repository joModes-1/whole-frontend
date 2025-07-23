import React from 'react';
import './ProfileSkeleton.css';

const ProfileSkeleton = () => (
  <div className="profile-skeleton">
    <div className="avatar-skeleton shimmer"></div>
    <div className="profile-lines">
      <div className="profile-line shimmer" style={{width: '80%'}}></div>
      <div className="profile-line shimmer" style={{width: '60%'}}></div>
    </div>
  </div>
);

export default ProfileSkeleton;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

const Profile = () => {
    const { profile, updateProfile } = useProfile();
    const { currentUser, logout } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        photo: ''
    });

    const navigate = useNavigate();

    const { showToast } = useToast();

    useEffect(() => {
        setFormData(profile);
    }, [profile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        updateProfile(formData);
        showToast('Profile updated successfully!', 'success');
        navigate('/');
    };

    // Preset avatar options - Add your images to: public/avatars/
    // Name them: avatar1.gif, avatar2.gif, avatar3.gif, avatar4.gif, avatar5.gif
    const presetAvatars = [
        { id: 'avatar1', name: 'Avatar 1', src: './avatars/avatar1.gif' },
        { id: 'avatar2', name: 'Avatar 2', src: './avatars/avatar2.gif' },
        { id: 'avatar3', name: 'Avatar 3', src: './avatars/avatar3.gif' },
        { id: 'avatar4', name: 'Avatar 4', src: './avatars/avatar4.gif' },
        { id: 'avatar5', name: 'Avatar 5', src: './avatars/avatar5.gif' },
    ];

    const handleSelectPreset = (avatarSrc) => {
        setFormData(prev => ({ ...prev, photo: avatarSrc }));
    };

    const bioRef = useRef(null);

    const handleNameKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            bioRef.current?.focus();
        }
    };

    const handleBioKeyDown = (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <div className="profile-page-container">
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-title-section">
                        <h1>Edit Profile</h1>
                        <p>Customize your personal presence</p>
                    </div>
                    {currentUser && (
                        <div className="user-status-badge">
                            <span className="status-dot"></span>
                            {currentUser.email}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="profile-form">
                    {/* Photo and Avatar Selection */}
                    <div className="photo-section">
                        <div className="photo-container">
                            <div className="photo-wrapper">
                                {formData.photo ? (
                                    <img src={formData.photo} alt="Profile" className="profile-img" />
                                ) : (
                                    <div className="placeholder-img">
                                        <span>{formData.name ? formData.name[0].toUpperCase() : '?'}</span>
                                    </div>
                                )}
                                <label htmlFor="photo-upload" className="photo-edit-overlay">
                                    <span className="edit-icon">📷</span>
                                </label>
                            </div>
                            <div className="preset-avatars-grid">
                                {presetAvatars.map(avatar => (
                                    <button
                                        key={avatar.id}
                                        type="button"
                                        onClick={() => handleSelectPreset(avatar.src)}
                                        className={`preset-avatar-btn ${formData.photo === avatar.src ? 'selected' : ''}`}
                                        title={avatar.name}
                                    >
                                        <img src={avatar.src} alt={avatar.name} />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* Form Fields */}
                    <div className="form-content">
                        <div className="form-group">
                            <label>Display Name</label>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Your Name"
                                style={{ width: '100%' }}
                                onKeyDown={handleNameKeyDown}
                            />
                        </div>

                        <div className="form-group">
                            <label>Bio</label>
                            <textarea
                                name="bio"
                                ref={bioRef}
                                value={formData.bio}
                                onChange={handleChange}
                                onKeyDown={handleBioKeyDown}
                                placeholder="Your mission in a few words..."
                                className="bio-textarea"
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button
                            type="button"
                            onClick={() => navigate('/')}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-color)'
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" style={{ background: 'var(--primary-color)', color: 'white' }}>
                            Save Profile
                        </Button>
                    </div>

                    {currentUser && (
                        <div className="logout-section">
                            <button
                                type="button"
                                className="logout-link"
                                onClick={async () => {
                                    await logout();
                                    navigate('/login');
                                }}
                            >
                                Sign out of account
                            </button>
                        </div>
                    )}
                </form>
            </div>

            <style>{`
                .profile-page-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: calc(100vh - 60px);
                    padding: 20px;
                    width: 100%;
                    box-sizing: border-box;
                    overflow: hidden;
                }

                .profile-card {
                    width: 100%;
                    max-width: 500px;
                    background: var(--card-bg);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border-radius: 24px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    animation: fadeIn 0.4s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .profile-header {
                    padding: 20px 25px 5px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                }

                .profile-title-section h1 {
                    font-size: 1.3rem;
                    font-weight: 700;
                    margin: 0 0 3px;
                    color: var(--text-color);
                }

                .profile-title-section p {
                    font-size: 0.8rem;
                    color: var(--text-color);
                    opacity: 0.6;
                    margin: 0;
                }

                .user-status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    font-size: 0.8rem;
                    color: var(--text-color);
                    border: 1px solid var(--border-color);
                }

                .status-dot {
                    width: 6px;
                    height: 6px;
                    background-color: var(--success-color, #10b981);
                    border-radius: 50%;
                    box-shadow: 0 0 8px var(--success-color, #10b981);
                }

                .profile-form {
                    padding: 15px 25px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .photo-section {
                    display: flex;
                    justify-content: center;
                }

                .photo-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }

                .photo-wrapper {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    position: relative;
                    overflow: hidden;
                    border: 3px solid var(--card-bg);
                    box-shadow: 0 0 0 2px var(--border-color);
                    background: var(--bg-color);
                }

                .profile-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .placeholder-img {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    color: white;
                    font-weight: 600;
                }

                .photo-edit-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s;
                    cursor: pointer;
                    color: white;
                }
                
                .photo-wrapper:hover .photo-edit-overlay {
                    opacity: 1;
                }

                .edit-icon { font-size: 1.2rem; margin-bottom: 2px; }
                .edit-text { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

                .remove-photo-btn {
                    background: none;
                    border: none;
                    color: #ef4444;
                    font-size: 0.8rem;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }
                .remove-photo-btn:hover { opacity: 1; background: rgba(239, 68, 68, 0.1); }

                .form-content {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .form-group label {
                    display: block;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-color);
                    margin-bottom: 6px;
                    opacity: 0.9;
                }

                .bio-textarea {
                    width: 100%;
                    min-height: 60px;
                    padding: 10px 12px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    color: var(--text-color);
                    font-family: inherit;
                    font-size: 0.9rem;
                    resize: none;
                    transition: all 0.2s;
                    line-height: 1.4;
                }
                
                .bio-textarea:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    background: rgba(255,255,255,0.05);
                }



                .preset-avatars-grid {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 10px;
                }

                .preset-avatar-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: 2px solid transparent;
                    padding: 0;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.2s;
                    opacity: 0.6;
                    background: var(--card-bg);
                }

                .preset-avatar-btn.selected {
                    border-color: var(--primary-color);
                    transform: scale(1.1);
                    opacity: 1;
                    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.2);
                }
                
                .preset-avatar-btn:hover {
                    opacity: 1;
                    transform: scale(1.1);
                }

                .preset-avatar-btn img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .form-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-top: 10px;
                }

                .logout-section {
                    text-align: center;
                    margin-top: 10px;
                    padding-top: 20px;
                    border-top: 1px solid var(--border-color);
                }

                .logout-link {
                    background: none;
                    border: none;
                    color: var(--text-color);
                    opacity: 0.5;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: opacity 0.2s;
                    text-decoration: underline;
                    text-underline-offset: 4px;
                }
                
                .logout-link:hover {
                    opacity: 0.8;
                    color: #ef4444;
                }
            `}</style>
        </div>
    );
};


export default Profile;

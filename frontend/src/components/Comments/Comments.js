import React, { useState, useEffect } from 'react';
import './Comments.css';

const Comments = ({ articleId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('No auth token found in local storage.');
                    return;
                }

                const response = await fetch('http://localhost:5000/api/user/profile', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`Error fetching profile: ${response.statusText}`);
                }

                const profileData = await response.json();
                setUserProfile(profileData);
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        };

        const fetchComments = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/articles/${articleId}/feedbacks`);
                if (!response.ok) {
                    throw new Error(`Error fetching comments: ${response.statusText}`);
                }

                const feedbackData = await response.json();
                setComments(feedbackData.data);
            } catch (error) {
                console.error('Error fetching comments:', error);
            }
        };

        fetchUserProfile();
        fetchComments();
    }, [articleId]);

    const handleCommentSubmit = async () => {
        if (newComment.trim() === "") {
            console.error('Comment text is empty.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No auth token found in local storage.');
                return;
            }
            //http://localhost:5000/api/articles/67581ba236d28b10f1d73f65/feedback
            const response = await fetch(`http://localhost:5000/api/articles/${articleId}/feedback`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: newComment,
                    user: userProfile?.id,
                    rating: 5, // Default rating
                    isPublic: true,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit feedback.');
            }

            const newFeedback = await response.json();
            setComments((prevComments) => [...prevComments, newFeedback.data]);
            setNewComment("");
        } catch (error) {
            console.error('Error submitting comment:', error);
        }
    };

    return (
        <div className="comments-section">
            <h2 className="section-title">User Feedback</h2>
            <div className="add-comment">
                <textarea
                    placeholder="Write your feedback here..."
                    className="comment-textarea"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <button className="submit-button" onClick={handleCommentSubmit}>
                    Give Feedback
                </button>
            </div>
            <div className="comments-list">
                {comments.length === 0 ? (
                    <p>No comments yet. Be the first to give feedback!</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment._id} className="comment">
                            <p>
                                <strong>
                                    {comment.user === userProfile?.id
                                        ? `${userProfile.firstName} ${userProfile.lastName}`
                                        : "Anonymous"}
                                </strong>: {comment.text}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Comments;

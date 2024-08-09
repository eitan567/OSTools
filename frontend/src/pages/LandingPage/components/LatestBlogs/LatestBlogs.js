import React from 'react';
import './LatestBlogs.css';
import Man from '../../../../assets/images/man.png';
import LatestBlogsImg from '../../../../assets/images/latestBlogsImg.png';


const blogPosts = [
  {
    id: 1,
    title: 'Best UI components for modern websites',
    excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras sit amet dictum neque, laoreet dolor.',
    category: 'Creative',
    image: LatestBlogsImg,
    author: {
      name: 'Samuyl Joshi',
      role: 'Graphic Designer',
      avatar: Man
    },
    date: '2025'
  },
  {
    id: 2,
    title: '9 simple ways to improve your design skills',
    excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras sit amet dictum neque, laoreet dolor.',
    category: 'Computer',
    image: LatestBlogsImg,
    author: {
      name: 'Musharof Chy',
      role: 'Content Writer',
      avatar: Man
    },
    date: '2025'
  },
  {
    id: 3,
    title: 'Tips to quickly improve your coding speed.',
    excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras sit amet dictum neque, laoreet dolor.',
    category: 'Design',
    image: LatestBlogsImg,
    author: {
      name: 'Lethium Deo',
      role: 'Graphic Designer',
      avatar: Man
    },
    date: '2025'
  }
];

const LatestBlogs = () => {
  return (
    <section id="latest-blogs" className="latest-blogs">
      <div className="blogs-content">
        <h2>Our Latest Blogs</h2>
        <p className='headerText'>There are many variations of passages of Lorem Ipsum available but the majority have suffered alteration in some form.</p>
        
        <div className="blog-grid">
          {blogPosts.map((post) => (
            <div key={post.id} className="blog-card">
              <div className="blog-image">
                <img src={post.image} alt={post.title} />
                <span className="category">{post.category}</span>
              </div>
              <div className="blog-content">
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <div className="blog-author">
                  <img src={post.author.avatar} alt={post.author.name} className="author-avatar" />
                  <div className="author-info">
                    <h4>By {post.author.name}</h4>
                    <p>{post.author.role}</p>
                  </div>
                  <p className="blog-date">Date<br/>{post.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestBlogs;
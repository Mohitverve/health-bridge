import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  CircularProgress,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const BlogPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'blogs'));
        const list = snapshot.docs.map(doc => {
          const data = doc.data();
          // Extract image URL
          let imageUrl = data.image || null;
          if (Array.isArray(data.image) && data.image.length) imageUrl = data.image[0];
          if (typeof data.image === 'object' && data.image.url) imageUrl = data.image.url;
          // Normalize date
          const dateObj = data.date && typeof data.date.toDate === 'function'
            ? data.date.toDate()
            : data.date
              ? new Date(data.date)
              : new Date();
          return {
            id: doc.id,
            title: data.title || '',
            excerpt: data.excerpt || '',
            content: data.content || '',
            imageUrl,
            date: dateObj,
          };
        });
        list.sort((a, b) => b.date - a.date);
        setBlogs(list);
      } catch (err) {
        console.error('Error fetching blogs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const handleOpen = blog => {
    setSelectedBlog(blog);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedBlog(null);
  };

  if (loading) return <CircularProgress sx={{ display: 'block', m: '50px auto' }} />;

  return (
    <Box sx={{ p: 3, mt: 4, mb: 4 }}>
      <Grid container spacing={4}>
        {blogs.map(blog => (
          <Grid item xs={12} md={6} lg={4} key={blog.id}>
            <Card
              sx={{
                maxWidth: 400,
                mx: 'auto',
                mb: 4,
                transition: 'transform 0.3s, box-shadow 0.3s',
                boxShadow: 1,
                '&:hover': { transform: 'scale(1.03)', boxShadow: 6 },
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
            >
              <CardActionArea onClick={() => handleOpen(blog)} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Always render with fallback placeholder */}
                <CardMedia
                  component="img"
                  height="200"
                  image={blog.imageUrl || '/placeholder.png'}
                  alt={blog.title}
                  onError={e => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {blog.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {blog.excerpt}
                  </Typography>
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Typography variant="caption" color="text.secondary">
                    {blog.date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle sx={{ m: 0, p: 2 }}>
          {selectedBlog?.title}
          <IconButton aria-label="close" onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {/* Dialog image with fallback */}
          <CardMedia
            component="img"
            height="300"
            image={selectedBlog?.imageUrl || '/placeholder.png'}
            alt={selectedBlog?.title}
            sx={{ mb: 2 }}
            onError={e => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
          />
          <DialogContentText sx={{ mb: 2 }}>
            {selectedBlog?.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BlogPage;

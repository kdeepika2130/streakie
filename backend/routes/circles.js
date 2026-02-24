import express from 'express';
import Circle from '../models/Circle.js';
import JoinRequest from '../models/JoinRequest.js'; // Needed for join request logic
import authMiddleware from '../middleware/authMiddleware.js'; // Your existing auth middleware
const router = express.Router();

// GET /api/circles - Get all circles with filtering and search
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, category, privacy, page = 1, limit = 12 } = req.query;
    
    let query = { isActive: true };
    
    if (search) query.$text = { $search: search };
    if (category && category !== 'All Categories') query.category = category;
    if (privacy) query.privacy = privacy;
    
    const circles = await Circle.find(query)
      .populate('creator', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const transformedCircles = circles.map(circle => ({
      _id: circle._id,
      name: circle.name,
      description: circle.description,
      members: circle.members.length,
      habits: circle.habits,
      privacy: circle.privacy,
      category: circle.category,
      image: circle.image,
      creator: circle.creator,
      createdAt: circle.createdAt,
      isCreator: circle.creator._id.toString() === req.user.id,
      isMember: circle.members.some(member => member.user._id.toString() === req.user.id)
    }));
    
    const total = await Circle.countDocuments(query);
    
    res.json({
      circles: transformedCircles,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching circles:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/circles/my - Get user's circles
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const circles = await Circle.find({
      $or: [
        { creator: req.user.id },
        { 'members.user': req.user.id }
      ],
      isActive: true
    })
      .populate('creator', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });
    
    const transformedCircles = circles.map(circle => ({
      _id: circle._id,
      name: circle.name,
      description: circle.description,
      members: circle.members.length,
      habits: circle.habits,
      privacy: circle.privacy,
      category: circle.category,
      image: circle.image,
      creator: circle.creator,
      createdAt: circle.createdAt,
      isCreator: circle.creator._id.toString() === req.user.id,
      isMember: circle.members.some(member => member.user._id.toString() === req.user.id)
    }));
    
    res.json(transformedCircles);
  } catch (error) {
    console.error('Error fetching user circles:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/circles - Create a new circle
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, privacy, habits, category, image } = req.body;
    
    if (!name || name.trim().length === 0) return res.status(400).json({ message: 'Circle name is required' });
    
    const existingCircle = await Circle.findOne({
      name: { $regex: new RegExp('^' + name + '$', 'i') },
      creator: req.user.id,
      isActive: true
    });
    
    if (existingCircle) return res.status(400).json({ message: 'You already have a circle with this name' });
    
    const circle = new Circle({
      name: name.trim(),
      description: description?.trim() || '',
      privacy: privacy || 'public',
      creator: req.user.id,
      habits: Array.isArray(habits) ? habits : [],
      category: category || 'Other',
      image: image || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
      members: [{ user: req.user.id }]
    });
    
    await circle.save();
    await circle.populate('creator', 'name email');
    
    res.status(201).json({
      _id: circle._id,
      name: circle.name,
      description: circle.description,
      members: circle.members.length,
      habits: circle.habits,
      privacy: circle.privacy,
      category: circle.category,
      image: circle.image,
      creator: circle.creator,
      createdAt: circle.createdAt,
      isCreator: true,
      isMember: true
    });
  } catch (error) {
    console.error('Error creating circle:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/circles/:id/join - Join a circle
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle || !circle.isActive) return res.status(404).json({ message: 'Circle not found' });
    
    if (circle.members.some(member => member.user.toString() === req.user.id))
      return res.status(400).json({ message: 'You are already a member of this circle' });
    if (circle.privacy === 'private')
      return res.status(403).json({ message: 'This is a private circle. You need an invitation to join.' });
    
    circle.members.push({ user: req.user.id });
    await circle.save();
    
    res.json({ message: 'Successfully joined the circle' });
  } catch (error) {
    console.error('Error joining circle:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/circles/:id/request - Request to join a private circle
router.post('/:id/request', authMiddleware, async (req, res) => {
  try {
    const circleId = req.params.id;
    const userId = req.user.id;
    // 1️⃣ Find the circle
    const circle = await Circle.findById(circleId);
    if (!circle || !circle.isActive)
      return res.status(404).json({ message: 'Circle not found' });
    // 2️⃣ Only private circles require requests
    if (circle.privacy !== 'private')
      return res.status(400).json({ message: 'This circle is not private' });
    // 3️⃣ Check if user already sent a pending request
    const existingRequest = await JoinRequest.findOne({
      userId,
      circleId,
      status: 'pending'
    });
    if (existingRequest)
      return res.status(400).json({ message: 'Request already sent' });
    // 4️⃣ Create a new join request
    const joinRequest = new JoinRequest({ userId, circleId });
    await joinRequest.save();
    // 5️⃣ Return the created request info
    res.status(201).json({
      _id: joinRequest._id,
      userId: joinRequest.userId,
      circleId: joinRequest.circleId,
      status: joinRequest.status,
      createdAt: joinRequest.createdAt
    });
  } catch (error) {
    console.error('Error in /circles/:id/request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/circles/:id/leave - Leave a circle
router.delete('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle || !circle.isActive)
      return res.status(404).json({ message: 'Circle not found' });

    // Prevent creator from leaving their own circle
    if (circle.creator.toString() === req.user.id)
      return res.status(400).json({ message: 'Circle creator cannot leave their own circle' });

    // Remove user from members array
    circle.members = circle.members.filter(
      (member) => member.user.toString() !== req.user.id
    );

    await circle.save();
    res.json({ message: 'Successfully left the circle' });
  } catch (error) {
    console.error('Error leaving circle:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/circles/:id - Delete circle (creator only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle || !circle.isActive) return res.status(404).json({ message: 'Circle not found' });
    if (circle.creator.toString() !== req.user.id)
      return res.status(403).json({ message: 'Only circle creator can delete the circle' });
    circle.isActive = false;
    await circle.save();
    res.json({ message: 'Circle deleted successfully' });
  } catch (error) {
    console.error('Error deleting circle:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/circles/:id - Get single circle details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id)
      .populate('creator', 'name email')
      .populate('members.user', 'name email');
    
    if (!circle || !circle.isActive) return res.status(404).json({ message: 'Circle not found' });
    if (circle.privacy === 'private') {
      const hasAccess = circle.creator._id.toString() === req.user.id ||
                       circle.members.some(member => member.user._id.toString() === req.user.id);
      if (!hasAccess) return res.status(403).json({ message: 'Access denied to private circle' });
    }
    
    res.json({
      _id: circle._id,
      name: circle.name,
      description: circle.description,
      members: circle.members.map(member => ({
        _id: member.user._id,
        name: member.user.name,
        email: member.user.email,
        joinedAt: member.joinedAt
      })),
      habits: circle.habits,
      privacy: circle.privacy,
      category: circle.category,
      image: circle.image,
      creator: circle.creator,
      createdAt: circle.createdAt,
      isCreator: circle.creator._id.toString() === req.user.id,
      isMember: circle.members.some(member => member.user._id.toString() === req.user.id)
    });
  } catch (error) {
    console.error('Error fetching circle:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/circles/:id - Update circle (creator only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle || !circle.isActive) return res.status(404).json({ message: 'Circle not found' });
    if (circle.creator.toString() !== req.user.id)
      return res.status(403).json({ message: 'Only circle creator can update the circle' });
    const { name, description, privacy, habits, category, image } = req.body;
    if (name) circle.name = name.trim();
    if (description !== undefined) circle.description = description.trim();
    if (privacy) circle.privacy = privacy;
    if (Array.isArray(habits)) circle.habits = habits;
    if (category) circle.category = category;
    if (image) circle.image = image;
    await circle.save();
    await circle.populate('creator', 'name email');
    res.json({
      _id: circle._id,
      name: circle.name,
      description: circle.description,
      members: circle.members.length,
      habits: circle.habits,
      privacy: circle.privacy,
      category: circle.category,
      image: circle.image,
      creator: circle.creator,
      createdAt: circle.createdAt,
      isCreator: true,
      isMember: true
    });
  } catch (error) {
    console.error('Error updating circle:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

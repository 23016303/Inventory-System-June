const express = require('express');
const router = express.Router();
const db = require('./includes/database');
const { verifyToken, requireLevel } = require('./includes/session');
const { remove_junk, validate_fields } = require('./includes/functions');

/**
 * User Groups Management Route - replaces group.php
 * Handles user groups (roles) management
 */

/**
 * Get all user groups
 */
router.get('/', verifyToken, requireLevel(1), async (req, res) => {
    try {
        const [groups] = await db.execute(`
            SELECT 
                id,
                group_name,
                group_level,
                group_status
            FROM user_groups
            ORDER BY group_level ASC
        `);
        
        const formattedGroups = groups.map(group => ({
            id: group.id,
            group_name: remove_junk(group.group_name),
            group_level: parseInt(group.group_level),
            group_status: parseInt(group.group_status) === 1 ? 'Active' : 'Inactive'
        }));
        
        res.json({
            success: true,
            data: {
                groups: formattedGroups,
                total: formattedGroups.length
            }
        });
        
    } catch (error) {
        console.error('Groups fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user groups'
        });
    }
});

/**
 * Get single group by ID
 */
router.get('/:id', verifyToken, requireLevel(1), async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        
        if (isNaN(groupId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid group ID'
            });
        }
        
        const [groups] = await db.execute(
            'SELECT * FROM user_groups WHERE id = ?',
            [groupId]
        );
        
        if (groups.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }
        
        const group = groups[0];
        res.json({
            success: true,
            data: {
                id: group.id,
                group_name: remove_junk(group.group_name),
                group_level: parseInt(group.group_level),
                group_status: parseInt(group.group_status)
            }
        });
        
    } catch (error) {
        console.error('Group fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching group'
        });
    }
});

/**
 * Create new group
 */
router.post('/', verifyToken, requireLevel(1), async (req, res) => {
    try {
        const { group_name, group_level, group_status } = req.body;
        
        // Validate required fields
        const errors = [];
        if (!group_name) errors.push('Group name is required');
        if (group_level === undefined || group_level === null) errors.push('Group level is required');
        if (group_status === undefined || group_status === null) errors.push('Group status is required');
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }
        
        // Check if group name already exists
        const [existing] = await db.execute(
            'SELECT id FROM user_groups WHERE group_name = ?',
            [group_name]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Group name already exists'
            });
        }
        
        // Create new group
        const [result] = await db.execute(`
            INSERT INTO user_groups (group_name, group_level, group_status)
            VALUES (?, ?, ?)
        `, [group_name, parseInt(group_level), parseInt(group_status)]);
        
        res.status(201).json({
            success: true,
            message: 'Group created successfully',
            data: {
                id: result.insertId,
                group_name: group_name,
                group_level: parseInt(group_level),
                group_status: parseInt(group_status)
            }
        });
        
    } catch (error) {
        console.error('Group creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating group'
        });
    }
});

/**
 * Update group
 */
router.put('/:id', verifyToken, requireLevel(1), async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        const { group_name, group_level, group_status } = req.body;
        
        if (isNaN(groupId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid group ID'
            });
        }
        
        // Validate required fields
        const errors = [];
        if (!group_name) errors.push('Group name is required');
        if (group_level === undefined || group_level === null) errors.push('Group level is required');
        if (group_status === undefined || group_status === null) errors.push('Group status is required');
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }
        
        // Check if group exists
        const [existing] = await db.execute(
            'SELECT id FROM user_groups WHERE id = ?',
            [groupId]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }
        
        // Check if group name already exists (exclude current group)
        const [nameCheck] = await db.execute(
            'SELECT id FROM user_groups WHERE group_name = ? AND id != ?',
            [group_name, groupId]
        );
        
        if (nameCheck.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Group name already exists'
            });
        }
        
        // Update group
        await db.execute(`
            UPDATE user_groups 
            SET group_name = ?, group_level = ?, group_status = ?
            WHERE id = ?
        `, [group_name, parseInt(group_level), parseInt(group_status), groupId]);
        
        res.json({
            success: true,
            message: 'Group updated successfully',
            data: {
                id: groupId,
                group_name: group_name,
                group_level: parseInt(group_level),
                group_status: parseInt(group_status)
            }
        });
        
    } catch (error) {
        console.error('Group update error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating group'
        });
    }
});

/**
 * Delete group
 */
router.delete('/:id', verifyToken, requireLevel(1), async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        
        if (isNaN(groupId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid group ID'
            });
        }
        
        // Check if group exists
        const [existing] = await db.execute(
            'SELECT id FROM user_groups WHERE id = ?',
            [groupId]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }
        
        // Check if group is being used by any users
        const [usersCheck] = await db.execute(
            'SELECT id FROM users WHERE user_level = ?',
            [groupId]
        );
        
        if (usersCheck.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete group that is assigned to users'
            });
        }
        
        // Delete group
        await db.execute('DELETE FROM user_groups WHERE id = ?', [groupId]);
        
        res.json({
            success: true,
            message: 'Group deleted successfully'
        });
        
    } catch (error) {
        console.error('Group deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting group'
        });
    }
});

module.exports = router;

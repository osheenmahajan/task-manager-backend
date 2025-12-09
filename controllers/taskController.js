const Task = require("../models/Task");
const mongoose = require("mongoose");

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private (Requires JWT)
const getTasks = async (req, res) => {
    try {
      const {status}   = req.query;
      let filter = {};
        if(status && status !== 'all') {
          filter.status = status;
        }
        let tasks;
        if(req.user.role === "admin") {
            tasks = await Task.find(filter).populate(
                "assignedTo",
                "name email profileImageUrl"
            );
        } else {
           tasks = await Task.find({...filter, assignedTo: {$in: [new mongoose.Types.ObjectId(req.user.id)]}}).populate(
                "assignedTo",
                "name email profileImageUrl"
            );
        }

        //add complete todochecklist count to each task
        tasks = await Promise.all(
            tasks.map(async (task) => {
                const completedCount = task.checkList.filter(
                (item) => item.completed
                ).length;
                return {...task._doc, completedTodoCount: completedCount};
            })  
        );

        //status summary count
        const userFilter = req.user.role === "admin" ? {} : {assignedTo: {$in: [new mongoose.Types.ObjectId(req.user.id)]}};
        const allTasks = await Task.countDocuments(userFilter);

        const pendingTasks = await Task.countDocuments({
            ...filter,
            status: "Pending",
            ...userFilter,
        });

        const inProgressTasks = await Task.countDocuments({
            ...filter,
            status: "In Progress",
            ...userFilter,
        });

        const completedTasks = await Task.countDocuments({
            ...filter,
            status: "Completed",
            ...userFilter,
        });

        res.json({
            tasks,
            statusSummary: {
                all: allTasks,
                pendingTasks,
                inProgressTasks,
                completedTasks,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private (Requires JWT)
const getTaskById = async (req, res) => {  
    try {
     const task = await Task.findById(req.params.id).populate(
        "assignedTo",
        "name email profileImageUrl"
     );
     
        if(!task) {
            return res.status(404).json({ message: "Task not found" });
         
        
        }
        res.json(task);

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }};
// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Admin only)
const createTask = async (req, res) => { 
    try {
      const{
        title,
        description,
        assignedTo,
        dueDate,
        priority,
        status,
        checkList,
        attachments
        
      } = req.body;
      
      if(!Array.isArray(assignedTo)) {
        return res.status(400).json({ message: "assignedTo must be a non-empty array of user IDs" });
      }

      const task = await Task.create({
        title,
        description,
        assignedTo,
        createdBt: req.user._id,
        dueDate,
        priority,
        status,
        checkList,
        attachments
        });

        res.status(201).json({message: "Task created successfully", task});
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }};
// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private (Requires JWT)
const updateTask = async (req, res) => { 
    try {
      const task = await Task.findById(req.params.id);
        if(!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        task.title = req.body.title || task.title;
        task.description = req.body.description || task.description;
        task.priority = req.body.priority || task.priority;
        task.dueDate = req.body.dueDate || task.dueDate;
        task.checkList = req.body.checkList || task.checkList;
        task.attachments = req.body.attachments || task.attachments;
        
        if(req.body.assignedTo) {
            if(!Array.isArray(req.body.assignedTo)) {
                return res.status(400).json({ message: "assignedTo must be a non-empty array of user IDs" });
            }
            task.assignedTo = req.body.assignedTo;
        }
        const updatedTask = await task.save();
        res.json({ message: "Task updated successfully", updatedTask });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }};
// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin only)
const deleteTask = async (req, res) => { 
    try {
      const task = await Task.findById(req.params.id);
        if(!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        await task.deleteOne();
        res.json({ message: "Task deleted successfully" });  
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }};
// @desc    Update task status
// @route   POST /api/tasks/:id/status
// @access  Private (Requires JWT)
const updateTaskStatus = async (req, res) => {
     try {
        const task = await Task.findById(req.params.id);
        if(!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        const isAssigned = task.assignedTo.some(
            (userId) => userId.toString() === req.user.id.toString()
        );
        if(!isAssigned && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized" });
        }

        task.status = req.body.status || task.status;

        if(task.status === "Completed") {
            task.checkList.forEach(item => {item.completed = true});
            task.progress = 100;
        }

        await task.save();
        res.json({ message: "Task status updated ", task });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }};
// @desc    Update task checklist (todo items)
// @route   POST /api/tasks/:id/todo
// @access  Private (Requires JWT)
const updateTaskChecklist = async (req, res) => { 
    try {
      console.log("updateTaskChecklist payload:", req.body);
      const {checkList} = req.body;

      if (!Array.isArray(checkList)) {
        return res.status(400).json({ message: "checkList must be an array" });
      }

      // Validate each checklist item has a non-empty text string
      for (const item of checkList) {
        if (typeof item.text !== "string" || item.text.trim() === "") {
          return res.status(400).json({ message: "Each checklist item must have a non-empty text property" });
        }
      }

      const task = await Task.findById(req.params.id);
        if(!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        if (!task.assignedTo.some(userId => userId.toString() === req.user.id.toString()) && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to update checklist" });
        }

        task.checkList = checkList;

        const completedItems = task.checkList.filter(
            (item) => item.completed
    ).length;
    const totalItems = task.checkList.length;
    task.progress =
    totalItems > 0 ?  Math.round((completedItems / totalItems) * 100):0;

        if(task.progress === 100) {
            task.status = "Completed";
        } else if(task.progress > 0) {
            task.status = "In Progress";
        } else {
            task.status = "Pending";
        }

        await task.save();
        const updatedTask = await Task.findById(req.params.id).populate(
            "assignedTo",
            "name email profileImageUrl"
        );
        res.json({ message: "Task checklist updated", task:updatedTask });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }};
// @desc    Get dashboard data (admin)
// @route   GET /api/tasks/dashboard-data
// @access  Private (Requires JWT)
const getUserDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const totalTasks = await Task.countDocuments({assignedTo: {$in: [userObjectId]}});
        const pendingTasks = await Task.countDocuments({ assignedTo: {$in: [userObjectId]}, status: "Pending"});
        const completedTasks = await Task.countDocuments({ assignedTo: {$in: [userObjectId]}, status: "Completed"});
        const overdueTasks = await Task.countDocuments({
            assignedTo: {$in: [userObjectId]},
            dueDate: {$lt: new Date()},
            status: {$ne: "Completed"},
        });

        const taskStatuses = ["Pending", "In Progress", "Completed"];
        const taskDistributionRaw = await Task.aggregate([
            {$match: {assignedTo: {$in: [userObjectId]}}},
            {
                $group: {
                    _id: "$status",
                    count: {$sum: 1},
                },
            },
        ]);
        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const formattedKey = status.replace(/\s+/g, "");
            acc[formattedKey] =
            taskDistributionRaw.find((item) => item._id === status)?.count || 0;
            return acc;
        }, {});
        taskDistribution["All"] = totalTasks;

        const taskpriorities = ["Low", "Medium", "High"];
        const taskPriorityLevelsRaw = await Task.aggregate([
            {$match: {assignedTo: {$in: [userObjectId]}}},
            {
                $group: {
                    _id: "$priority",
                    count: {$sum: 1},
                },
            },
        ]);
        const taskPriorityLevels = taskpriorities.reduce((acc, priority) => {
            acc[priority] =
            taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
            return acc;
        }, {});

        const recentTasks = await Task.find({assignedTo: {$in: [userObjectId]}})
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title status priority dueDate assignedTo");
        res.status(200).json({
            statistics:{
            totalTasks,
            pendingTasks,
            completedTasks,
            overdueTasks,
            },

            charts:{
                taskDistribution,
                taskPriorityLevels,
            },
            recentTasks,
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }};
// @desc    Get user-specific dashboard data
// @route   GET /api/tasks/user-dashboard-data
// @access  Private (Requires JWT)
const getDashboardData = async (req, res) => { 
    try {
       const totalTasks = await Task.countDocuments();
       const pendingTasks = await Task.countDocuments({status: "Pending"});
       const completedTasks = await Task.countDocuments({status: "Completed"});
       const overdueTasks = await Task.countDocuments({
        dueDate: {$lt: new Date()},
        status: {$ne: "Completed"},
       }); 

       const taskStatuses = ["Pending", "In Progress", "Completed"];
       const taskDistributionRaw = await Task.aggregate([
        {
            $group: {
                _id: "$status",
                count: {$sum: 1},
            },
        },
         ]);    

        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const formattedKey = status.replace(/\s+/g, "");
            acc[formattedKey] = 
            taskDistributionRaw.find((item) => item._id === status)?.count || 0;
            return acc;
        }, {});
        taskDistribution["All"] = totalTasks;

        const taskpriorities = ["Low", "Medium", "High"];
        const taskPriorityLevelsRaw = await Task.aggregate([
            {
                $group: {
                    _id: "$priority",
                    count: {$sum: 1},
                },
            },
        ]);
        const taskPriorityLevels = taskpriorities.reduce((acc, priority) => {
            acc[priority] =
            taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
            return acc;
        }, {});

        const recentTasks = await Task.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title status priority dueDate assignedTo")

        res.status(200).json({
            statistics:{
            totalTasks,
            pendingTasks,
            completedTasks,
            overdueTasks,
            },

            charts:{
                taskDistribution,
                taskPriorityLevels,
            },
            recentTasks,
        });
            
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
    };        

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,       
    updateTaskChecklist,
    getDashboardData,
    getUserDashboardData
};
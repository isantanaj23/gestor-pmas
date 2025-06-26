const Project = require('../models/Project');
const Task = require('../models/Task');
const Contact = require('../models/Contact');
const Activity = require('../models/Activity');

/**
 * @desc    Obtener estadísticas generales del dashboard
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Estadísticas de Proyectos
        const projectStats = await Project.aggregate([
            { $match: { owner: userId } },
            {
                $group: {
                    _id: null,
                    totalProjects: { $sum: 1 },
                    activeProjects: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    completedProjects: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    averageProgress: { $avg: '$progress' }
                }
            }
        ]);

        // Estadísticas de Tareas
        const taskStats = await Task.aggregate([
            { 
                $lookup: {
                    from: 'projects',
                    localField: 'project',
                    foreignField: '_id',
                    as: 'projectInfo'
                }
            },
            { $unwind: '$projectInfo' },
            { $match: { 'projectInfo.owner': userId } },
            {
                $group: {
                    _id: null,
                    totalTasks: { $sum: 1 },
                    pendingTasks: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    },
                    inProgressTasks: {
                        $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
                    },
                    reviewTasks: {
                        $sum: { $cond: [{ $eq: ['$status', 'review'] }, 1, 0] }
                    },
                    completedTasks: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    highPriorityTasks: {
                        $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
                    }
                }
            }
        ]);

        // Estadísticas de CRM
        const crmStats = await Contact.aggregate([
            { $match: { owner: userId } },
            {
                $group: {
                    _id: null,
                    totalContacts: { $sum: 1 },
                    leads: {
                        $sum: { $cond: [{ $eq: ['$stage', 'lead'] }, 1, 0] }
                    },
                    contacted: {
                        $sum: { $cond: [{ $eq: ['$stage', 'contacted'] }, 1, 0] }
                    },
                    proposal: {
                        $sum: { $cond: [{ $eq: ['$stage', 'proposal'] }, 1, 0] }
                    },
                    client: {
                        $sum: { $cond: [{ $eq: ['$stage', 'client'] }, 1, 0] }
                    },
                    totalValue: { $sum: '$value' },
                    averageValue: { $avg: '$value' }
                }
            }
        ]);

        // Estadísticas de Actividades
        const activityStats = await Activity.aggregate([
            { $match: { owner: userId } },
            {
                $group: {
                    _id: null,
                    totalActivities: { $sum: 1 },
                    completedActivities: {
                        $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] }
                    },
                    pendingActivities: {
                        $sum: { $cond: [{ $eq: ['$completed', false] }, 1, 0] }
                    },
                    overdueActivities: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$completed', false] },
                                        { $lt: ['$scheduledDate', new Date()] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        // Calcular tasa de conversión CRM
        const conversionRate = crmStats[0] 
            ? ((crmStats[0].client / crmStats[0].totalContacts) * 100).toFixed(1)
            : 0;

        // Calcular porcentaje de tareas completadas
        const taskCompletionRate = taskStats[0]
            ? ((taskStats[0].completedTasks / taskStats[0].totalTasks) * 100).toFixed(1)
            : 0;

        const stats = {
            projects: projectStats[0] || {
                totalProjects: 0,
                activeProjects: 0,
                completedProjects: 0,
                averageProgress: 0
            },
            tasks: taskStats[0] || {
                totalTasks: 0,
                pendingTasks: 0,
                inProgressTasks: 0,
                reviewTasks: 0,
                completedTasks: 0,
                highPriorityTasks: 0
            },
            crm: crmStats[0] || {
                totalContacts: 0,
                leads: 0,
                contacted: 0,
                proposal: 0,
                client: 0,
                totalValue: 0,
                averageValue: 0
            },
            activities: activityStats[0] || {
                totalActivities: 0,
                completedActivities: 0,
                pendingActivities: 0,
                overdueActivities: 0
            },
            summary: {
                conversionRate: parseFloat(conversionRate),
                taskCompletionRate: parseFloat(taskCompletionRate),
                activeProjectsCount: projectStats[0] ? projectStats[0].activeProjects : 0,
                urgentTasksCount: taskStats[0] ? taskStats[0].highPriorityTasks : 0
            }
        };

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor obteniendo estadísticas',
            error: error.message
        });
    }
};

/**
 * @desc    Obtener actividad reciente del usuario
 * @route   GET /api/dashboard/recent-activity
 * @access  Private
 */
const getRecentActivity = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 10;

        // Actividades recientes combinadas
        const recentActivities = [];

        // Tareas recientes (creadas o actualizadas)
        const recentTasks = await Task.find({
            $or: [
                { assignedTo: userId },
                { createdBy: userId }
            ]
        })
        .populate('project', 'name')
        .populate('assignedTo', 'name')
        .populate('createdBy', 'name')
        .sort({ updatedAt: -1 })
        .limit(5);

        recentTasks.forEach(task => {
            recentActivities.push({
                id: task._id,
                type: 'task',
                action: task.status === 'completed' ? 'completed' : 'updated',
                title: task.title,
                description: `Tarea en proyecto: ${task.project.name}`,
                user: task.assignedTo.name,
                date: task.updatedAt,
                priority: task.priority,
                status: task.status
            });
        });

        // Contactos recientes
        const recentContacts = await Contact.find({ owner: userId })
            .sort({ updatedAt: -1 })
            .limit(3);

        recentContacts.forEach(contact => {
            recentActivities.push({
                id: contact._id,
                type: 'contact',
                action: 'updated',
                title: `${contact.firstName} ${contact.lastName}`,
                description: `Contacto de ${contact.company} - ${contact.stage}`,
                user: req.user.name,
                date: contact.updatedAt,
                stage: contact.stage,
                value: contact.value
            });
        });

        // Actividades CRM completadas recientes
        const recentCrmActivities = await Activity.find({ 
            owner: userId,
            completed: true
        })
        .populate('contact', 'firstName lastName company')
        .sort({ updatedAt: -1 })
        .limit(4);

        recentCrmActivities.forEach(activity => {
            recentActivities.push({
                id: activity._id,
                type: 'activity',
                action: 'completed',
                title: activity.title,
                description: `${activity.type} con ${activity.contact.firstName} ${activity.contact.lastName}`,
                user: req.user.name,
                date: activity.updatedAt,
                activityType: activity.type,
                outcome: activity.outcome
            });
        });

        // Proyectos actualizados recientemente
        const recentProjects = await Project.find({ owner: userId })
            .sort({ updatedAt: -1 })
            .limit(2);

        recentProjects.forEach(project => {
            recentActivities.push({
                id: project._id,
                type: 'project',
                action: 'updated',
                title: project.name,
                description: `Progreso: ${project.progress}%`,
                user: req.user.name,
                date: project.updatedAt,
                status: project.status,
                progress: project.progress
            });
        });

        // Ordenar por fecha y limitar
        const sortedActivities = recentActivities
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);

        res.status(200).json({
            success: true,
            data: sortedActivities
        });

    } catch (error) {
        console.error('Error obteniendo actividad reciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor obteniendo actividad reciente',
            error: error.message
        });
    }
};

/**
 * @desc    Obtener métricas de productividad semanal
 * @route   GET /api/dashboard/weekly-metrics
 * @access  Private
 */
const getWeeklyMetrics = async (req, res) => {
    try {
        const userId = req.user.id;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Tareas completadas esta semana
        const weeklyTasks = await Task.countDocuments({
            assignedTo: userId,
            status: 'completed',
            updatedAt: { $gte: oneWeekAgo }
        });

        // Actividades CRM completadas esta semana
        const weeklyActivities = await Activity.countDocuments({
            owner: userId,
            completed: true,
            updatedAt: { $gte: oneWeekAgo }
        });

        // Nuevos contactos esta semana
        const weeklyContacts = await Contact.countDocuments({
            owner: userId,
            createdAt: { $gte: oneWeekAgo }
        });

        // Progreso promedio de proyectos activos
        const activeProjectsProgress = await Project.aggregate([
            { 
                $match: { 
                    owner: userId, 
                    status: 'active' 
                } 
            },
            {
                $group: {
                    _id: null,
                    averageProgress: { $avg: '$progress' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const metrics = {
            weeklyTasksCompleted: weeklyTasks,
            weeklyActivitiesCompleted: weeklyActivities,
            weeklyNewContacts: weeklyContacts,
            activeProjectsAvgProgress: activeProjectsProgress[0] 
                ? Math.round(activeProjectsProgress[0].averageProgress) 
                : 0,
            activeProjectsCount: activeProjectsProgress[0] 
                ? activeProjectsProgress[0].count 
                : 0,
            weekPeriod: {
                from: oneWeekAgo.toISOString(),
                to: new Date().toISOString()
            }
        };

        res.status(200).json({
            success: true,
            data: metrics
        });

    } catch (error) {
        console.error('Error obteniendo métricas semanales:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor obteniendo métricas semanales',
            error: error.message
        });
    }
};

module.exports = {
    getDashboardStats,
    getRecentActivity,
    getWeeklyMetrics
};
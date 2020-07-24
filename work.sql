/*
Navicat MySQL Data Transfer

Source Server         : 192.168.0.70
Source Server Version : 80020
Source Host           : 192.168.0.70:3306
Source Database       : work

Target Server Type    : MYSQL
Target Server Version : 80020
File Encoding         : 65001

Date: 2020-07-24 13:35:56
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for department
-- ----------------------------
DROP TABLE IF EXISTS `department`;
CREATE TABLE `department` (
  `department_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '部门id',
  `department_name` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '部门名称',
  `creator_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '创建人id',
  `department_description` longtext CHARACTER SET utf8 COLLATE utf8_general_ci COMMENT '部门描述',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `department_id` (`department_id`) USING BTREE,
  KEY `department_ibfk_1` (`creator_id`) USING BTREE,
  CONSTRAINT `department_ibfk_1` FOREIGN KEY (`creator_id`) REFERENCES `employee` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for employee
-- ----------------------------
DROP TABLE IF EXISTS `employee`;
CREATE TABLE `employee` (
  `user_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '员工id',
  `username` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '员工姓名',
  `password` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '密码',
  `role` tinyint(1) NOT NULL DEFAULT '3' COMMENT '角色权限',
  `join_time` datetime DEFAULT NULL COMMENT '入职时间',
  `mobile` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '手机号',
  `telphone` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '座机号',
  `email` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '电子邮箱',
  `job_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '职位id',
  `head_url` longtext CHARACTER SET utf8 COLLATE utf8_general_ci COMMENT '头像链接',
  `description` longtext CHARACTER SET utf8 COLLATE utf8_general_ci COMMENT '详细描述',
  `gender` tinyint(1) DEFAULT NULL COMMENT '性别0-男 1-女',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  UNIQUE KEY `username` (`username`) USING BTREE,
  UNIQUE KEY `user_id` (`user_id`) USING BTREE,
  KEY `job_id` (`job_id`) USING BTREE,
  KEY `authority` (`role`) USING BTREE,
  CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `job` (`job_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for job
-- ----------------------------
DROP TABLE IF EXISTS `job`;
CREATE TABLE `job` (
  `job_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '职位id',
  `job_name` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '职位名称',
  `department_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '这个职位所属部门',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  UNIQUE KEY `job_id` (`job_id`) USING BTREE,
  KEY `job_ibfk_1` (`department_id`) USING BTREE,
  CONSTRAINT `job_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for memo
-- ----------------------------
DROP TABLE IF EXISTS `memo`;
CREATE TABLE `memo` (
  `memo_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '备忘录id',
  `title` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '备忘录标题',
  `content` longtext CHARACTER SET utf8 COLLATE utf8_general_ci COMMENT '备忘录内容',
  `user_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '使用者id',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `memo_id` (`memo_id`) USING BTREE,
  KEY `user_id` (`user_id`) USING BTREE,
  CONSTRAINT `memo_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `employee` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for notice
-- ----------------------------
DROP TABLE IF EXISTS `notice`;
CREATE TABLE `notice` (
  `notice_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '通知id',
  `reminder_id` varchar(50) DEFAULT NULL COMMENT '提醒人id',
  `reminderd_id` varchar(50) DEFAULT NULL COMMENT '被提醒人id',
  `message` varchar(255) DEFAULT NULL COMMENT '提醒消息',
  `isRead` tinyint(1) DEFAULT NULL COMMENT '是否已读 0-否 1-是',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  KEY `reminder_id` (`reminder_id`),
  KEY `reminderd_id` (`reminderd_id`),
  CONSTRAINT `notice_ibfk_1` FOREIGN KEY (`reminder_id`) REFERENCES `employee` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `notice_ibfk_2` FOREIGN KEY (`reminderd_id`) REFERENCES `employee` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for project
-- ----------------------------
DROP TABLE IF EXISTS `project`;
CREATE TABLE `project` (
  `project_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '项目id',
  `project_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '项目名称',
  `creator_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '项目发起人',
  `project_description` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '项目描述',
  `starttime` datetime DEFAULT NULL COMMENT '开始日期',
  `endtime` datetime DEFAULT NULL COMMENT '结束日期',
  `status` tinyint(1) DEFAULT NULL COMMENT '状态',
  `bgcolor` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '封皮颜色',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `project_id` (`project_id`) USING BTREE,
  KEY `creator_id` (`creator_id`) USING BTREE,
  CONSTRAINT `project_ibfk_1` FOREIGN KEY (`creator_id`) REFERENCES `employee` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for projectgroup
-- ----------------------------
DROP TABLE IF EXISTS `projectgroup`;
CREATE TABLE `projectgroup` (
  `user_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '负责人id',
  `project_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '项目id',
  `user_role` tinyint(1) DEFAULT NULL COMMENT '负责人权限',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY `role` (`user_role`) USING BTREE,
  KEY `project_id` (`project_id`) USING BTREE,
  KEY `user_id` (`user_id`) USING BTREE,
  CONSTRAINT `projectgroup_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `employee` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `projectgroup_ibfk_3` FOREIGN KEY (`project_id`) REFERENCES `project` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for taskfirst
-- ----------------------------
DROP TABLE IF EXISTS `taskfirst`;
CREATE TABLE `taskfirst` (
  `tf_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '一级任务id',
  `create_date` datetime NOT NULL COMMENT '建立日期',
  `modfiy_date` datetime NOT NULL COMMENT '修改日期',
  `status` tinyint(1) unsigned zerofill NOT NULL DEFAULT '0' COMMENT '任务状态(0-进行中，1-已完成，2-未完成)',
  `tf_content` longtext CHARACTER SET utf8 COLLATE utf8_general_ci COMMENT '一级任务内容',
  `creator_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '创建者id',
  `creator_role` tinyint(1) DEFAULT NULL COMMENT '创建者角色',
  `executor_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '执行人id',
  `description` longtext CHARACTER SET utf8 COLLATE utf8_general_ci COMMENT '备注',
  `project_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT '' COMMENT '项目id',
  `urgent` tinyint(1) DEFAULT NULL COMMENT '紧急程度：1-紧急 2-正常',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `note` longtext CHARACTER SET utf8 COLLATE utf8_general_ci COMMENT '批注',
  UNIQUE KEY `tf_id` (`tf_id`) USING BTREE,
  KEY `creator_id` (`creator_id`) USING BTREE,
  KEY `creator_role` (`creator_role`) USING BTREE,
  KEY `executor_id` (`executor_id`) USING BTREE,
  KEY `project_id` (`project_id`) USING BTREE,
  CONSTRAINT `taskfirst_ibfk_1` FOREIGN KEY (`creator_id`) REFERENCES `employee` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `taskfirst_ibfk_2` FOREIGN KEY (`creator_role`) REFERENCES `employee` (`role`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `taskfirst_ibfk_3` FOREIGN KEY (`executor_id`) REFERENCES `employee` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for teamwork
-- ----------------------------
DROP TABLE IF EXISTS `teamwork`;
CREATE TABLE `teamwork` (
  `tw_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '协作id',
  `tf_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '一级任务id',
  `project_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '项目id',
  `content` longtext CHARACTER SET utf8 COLLATE utf8_general_ci COMMENT '协作内容',
  `status` tinyint(1) unsigned zerofill NOT NULL DEFAULT '0' COMMENT '0-进行中 1-已完成，2-未完成',
  `creator_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '发起人id',
  `creator_role` tinyint(1) DEFAULT NULL COMMENT '发起人权限',
  `description` longtext CHARACTER SET utf8 COLLATE utf8_general_ci COMMENT '备注',
  `isrefuse` tinyint(1) DEFAULT NULL COMMENT '是否拒绝',
  `urgent` tinyint(1) DEFAULT NULL COMMENT '紧急程度 1-紧急 2-正常',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `longtext` longtext COMMENT '批注',
  `executor_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '协同人id',
  `ts_id` varchar(255) DEFAULT NULL,
  UNIQUE KEY `tw_id` (`tw_id`) USING BTREE,
  KEY `tf_id` (`tf_id`) USING BTREE,
  KEY `project_id` (`project_id`) USING BTREE,
  KEY `creator_id` (`creator_id`) USING BTREE,
  KEY `creator_role` (`creator_role`) USING BTREE,
  KEY `executor_id` (`executor_id`),
  CONSTRAINT `teamwork_ibfk_1` FOREIGN KEY (`tf_id`) REFERENCES `taskfirst` (`tf_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `teamwork_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `project` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `teamwork_ibfk_3` FOREIGN KEY (`creator_id`) REFERENCES `employee` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `teamwork_ibfk_4` FOREIGN KEY (`creator_role`) REFERENCES `employee` (`role`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `teamwork_ibfk_5` FOREIGN KEY (`executor_id`) REFERENCES `employee` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for week
-- ----------------------------
DROP TABLE IF EXISTS `week`;
CREATE TABLE `week` (
  `week_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '周评价表id',
  `startweekdate` datetime DEFAULT NULL COMMENT '起始周日期',
  `endweekdate` datetime DEFAULT NULL COMMENT '结束周日期',
  `evaluator_id` varchar(50) DEFAULT NULL COMMENT '评价人id',
  `evaluated_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '被评价人id',
  `score` double(3,2) DEFAULT NULL COMMENT '打分',
  `evaluate` longtext CHARACTER SET utf8 COLLATE utf8_general_ci COMMENT '评价',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改世家',
  KEY `week_ibfk_1` (`evaluator_id`),
  KEY `week_ibfk_2` (`evaluated_id`),
  CONSTRAINT `week_ibfk_1` FOREIGN KEY (`evaluator_id`) REFERENCES `employee` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `week_ibfk_2` FOREIGN KEY (`evaluated_id`) REFERENCES `employee` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

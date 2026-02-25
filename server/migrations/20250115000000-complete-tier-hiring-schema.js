'use strict';
/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    // --- Exams and Assessment Tables ---

    await queryInterface.createTable('Exams', {
      exam_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      domain_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Domains',
          key: 'domain_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      exam_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      exam_type: {
        type: Sequelize.ENUM('INITIAL', 'SHIFTING', 'INTERNAL', 'CUSTOM'),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      duration_minutes: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      total_questions: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      passing_score: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Recruiters',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.createTable('Questions', {
      question_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      exam_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Exams',
          key: 'exam_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      question_type: {
        type: Sequelize.ENUM('MULTIPLE_CHOICE', 'CODING', 'SQL', 'PROJECT', 'TEXT'),
        allowNull: false
      },
      question_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      options: {
        type: Sequelize.JSONB // For multiple choice options
      },
      correct_answer: {
        type: Sequelize.TEXT
      },
      test_cases: {
        type: Sequelize.JSONB // For coding questions
      },
      points: {
        type: Sequelize.INTEGER,
        defaultValue: 10
      },
      difficulty: {
        type: Sequelize.ENUM('EASY', 'MEDIUM', 'HARD'),
        defaultValue: 'MEDIUM'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.createTable('Exam_Attempts', {
      attempt_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      candidate_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Candidates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      exam_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Exams',
          key: 'exam_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      domain_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Domains',
          key: 'domain_id'
        }
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      max_score: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      percentage: {
        type: Sequelize.DECIMAL(5,2),
        allowNull: false
      },
      time_taken_minutes: {
        type: Sequelize.INTEGER
      },
      answers: {
        type: Sequelize.JSONB // Store candidate's answers
      },
      status: {
        type: Sequelize.ENUM('IN_PROGRESS', 'COMPLETED', 'ABANDONED'),
        defaultValue: 'IN_PROGRESS'
      },
      started_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      completed_at: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // --- Tier Management Tables ---

    await queryInterface.createTable('Candidate_Domain_Performance', {
      performance_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      candidate_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Candidates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      domain_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Domains',
          key: 'domain_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tier_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tiers',
          key: 'tier_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      current_rank: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      total_score: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      average_score: {
        type: Sequelize.DECIMAL(5,2),
        defaultValue: 0.00
      },
      participation_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      last_active: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'WAITING_LIST', 'INACTIVE', 'COOLDOWN'),
        defaultValue: 'ACTIVE'
      },
      tier_assigned_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      unique: ['candidate_id', 'domain_id']
    });

    await queryInterface.createTable('Tier_Thresholds', {
      threshold_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      domain_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Domains',
          key: 'domain_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tier_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tiers',
          key: 'tier_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      min_score: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      max_score: {
        type: Sequelize.INTEGER
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      effective_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // --- Contest System Tables ---

    await queryInterface.createTable('Contests', {
      contest_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      contest_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      contest_type: {
        type: Sequelize.ENUM('SHIFTING', 'INTERNAL', 'SPECIAL'),
        allowNull: false
      },
      domain_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Domains',
          key: 'domain_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      description: {
        type: Sequelize.TEXT
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      duration_minutes: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      max_participants: {
        type: Sequelize.INTEGER
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Recruiters',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.createTable('Contest_Participations', {
      participation_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      candidate_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Candidates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      contest_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Contests',
          key: 'contest_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      rank: {
        type: Sequelize.INTEGER
      },
      time_taken_minutes: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.ENUM('REGISTERED', 'IN_PROGRESS', 'COMPLETED', 'DISQUALIFIED'),
        defaultValue: 'REGISTERED'
      },
      registered_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      started_at: {
        type: Sequelize.DATE
      },
      completed_at: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      unique: ['candidate_id', 'contest_id']
    });

    // --- Cooldown and Premium Features ---

    await queryInterface.createTable('Cooldown_Periods', {
      cooldown_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      candidate_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Candidates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      job_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Jobs',
          key: 'job_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      duration_days: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      reason: {
        type: Sequelize.ENUM('HIRED', 'VIOLATION', 'ADMIN'),
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.createTable('Premium_Subscriptions', {
      subscription_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      candidate_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Candidates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      plan_type: {
        type: Sequelize.ENUM('MONTHLY', 'QUARTERLY', 'YEARLY'),
        allowNull: false
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'EXPIRED', 'CANCELLED'),
        defaultValue: 'ACTIVE'
      },
      payment_id: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // --- Analytics and Recruiter Features ---

    await queryInterface.createTable('Analytics_Data', {
      analytics_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      domain_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Domains',
          key: 'domain_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tier_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tiers',
          key: 'tier_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      metric_type: {
        type: Sequelize.ENUM('AVERAGE_SCORE', 'PARTICIPATION_RATE', 'TURNOVER_RATE', 'SKILL_DISTRIBUTION'),
        allowNull: false
      },
      metric_value: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
      },
      sample_size: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      period_start: {
        type: Sequelize.DATE,
        allowNull: false
      },
      period_end: {
        type: Sequelize.DATE,
        allowNull: false
      },
      generated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.createTable('Recruiter_Subscriptions', {
      subscription_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      recruiter_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Recruiters',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tier_access_level: {
        type: Sequelize.ENUM('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'),
        allowNull: false
      },
      max_tier_access: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'EXPIRED', 'CANCELLED'),
        defaultValue: 'ACTIVE'
      },
      features: {
        type: Sequelize.JSONB // Store allowed features
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add missing columns to existing tables
    await queryInterface.addColumn('Candidates', 'premium_status', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('Candidates', 'last_login', {
      type: Sequelize.DATE
    });

    await queryInterface.addColumn('Tiers', 'yearly_cost', {
      type: Sequelize.DECIMAL(10,2),
      defaultValue: 0.00
    });

    await queryInterface.addColumn('Tiers', 'features', {
      type: Sequelize.JSONB
    });

    // Create indexes for better performance
    await queryInterface.addIndex('Exam_Attempts', ['candidate_id', 'exam_id']);
    await queryInterface.addIndex('Candidate_Domain_Performance', ['candidate_id', 'domain_id']);
    await queryInterface.addIndex('Contest_Participations', ['candidate_id', 'contest_id']);
    await queryInterface.addIndex('Analytics_Data', ['domain_id', 'tier_id', 'metric_type']);
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('Analytics_Data');
    await queryInterface.dropTable('Recruiter_Subscriptions');
    await queryInterface.dropTable('Premium_Subscriptions');
    await queryInterface.dropTable('Cooldown_Periods');
    await queryInterface.dropTable('Contest_Participations');
    await queryInterface.dropTable('Contests');
    await queryInterface.dropTable('Tier_Thresholds');
    await queryInterface.dropTable('Candidate_Domain_Performance');
    await queryInterface.dropTable('Exam_Attempts');
    await queryInterface.dropTable('Questions');
    await queryInterface.dropTable('Exams');

    // Remove added columns
    await queryInterface.removeColumn('Candidates', 'premium_status');
    await queryInterface.removeColumn('Candidates', 'last_login');
    await queryInterface.removeColumn('Tiers', 'yearly_cost');
    await queryInterface.removeColumn('Tiers', 'features');
  }
};

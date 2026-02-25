'use strict';

export default {
  async up(queryInterface, Sequelize) {
    // Create Problems table
    await queryInterface.createTable('Problems', {
      problem_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      difficulty: {
        type: Sequelize.ENUM('EASY', 'MEDIUM', 'HARD'),
        allowNull: false,
        defaultValue: 'EASY'
      },
      domain_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Domains',
          key: 'domain_id'
        }
      },
      constraints: {
        type: Sequelize.TEXT
      },
      examples: {
        type: Sequelize.JSON
      },
      test_files: {
        type: Sequelize.JSON
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create Test_Cases table
    await queryInterface.createTable('Test_Cases', {
      test_case_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      problem_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Problems',
          key: 'problem_id'
        }
      },
      input: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      expected_output: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      is_hidden: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create Submissions table
    await queryInterface.createTable('Submissions', {
      submission_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      problem_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Problems',
          key: 'problem_id'
        }
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Candidates',
          key: 'candidate_id'
        }
      },
      submission_type: {
        type: Sequelize.ENUM('PYTHON', 'JAVASCRIPT', 'JAVA', 'CPP', 'SQL', 'REACT'),
        allowNull: false
      },
      code: {
        type: Sequelize.TEXT
      },
      sql_query: {
        type: Sequelize.TEXT
      },
      code_files: {
        type: Sequelize.JSON
      },
      status: {
        type: Sequelize.ENUM('SUBMITTED', 'ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'COMPILATION_ERROR'),
        allowNull: false,
        defaultValue: 'SUBMITTED'
      },
      score: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      execution_time: {
        type: Sequelize.FLOAT
      },
      memory_used: {
        type: Sequelize.FLOAT
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Submissions');
    await queryInterface.dropTable('Test_Cases');
    await queryInterface.dropTable('Problems');
  }
};

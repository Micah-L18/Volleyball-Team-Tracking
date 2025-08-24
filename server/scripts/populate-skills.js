const pool = require('../models/db');

async function populateVolleyballSkills() {
  try {
    console.log('Populating volleyball skills database...');

    // Clear existing skills
    await pool.query('DELETE FROM volleyball_skills');

    // Insert serving skills
    const servingSkills = [
      { name: 'Float Serve', category: 'Serving', description: 'Basic overhand serve with minimal spin' },
      { name: 'Jump Serve', category: 'Serving', description: 'Advanced serve with jump approach' },
      { name: 'Topspin Serve', category: 'Serving', description: 'Serve with forward rotation' },
      { name: 'Underhand Serve', category: 'Serving', description: 'Basic underhand serving technique' },
      { name: 'Serve Placement', category: 'Serving', description: 'Accuracy and targeting in serving' },
      { name: 'Serve Power', category: 'Serving', description: 'Speed and force behind serves' }
    ];

    // Insert passing skills
    const passingSkills = [
      { name: 'Platform Pass', category: 'Passing', description: 'Basic forearm pass technique' },
      { name: 'Serve Receive', category: 'Passing', description: 'Receiving opponent serves' },
      { name: 'Dig', category: 'Passing', description: 'Defensive passing of attacks' },
      { name: 'Overhead Pass', category: 'Passing', description: 'Passing using fingertips overhead' },
      { name: 'Emergency Pass', category: 'Passing', description: 'One-handed or sprawling passes' },
      { name: 'Pass Accuracy', category: 'Passing', description: 'Precision in pass placement' }
    ];

    // Insert setting skills
    const settingSkills = [
      { name: 'Front Set', category: 'Setting', description: 'Setting the ball in front of the setter' },
      { name: 'Back Set', category: 'Setting', description: 'Setting behind the setter' },
      { name: 'Quick Set', category: 'Setting', description: 'Fast, low sets for quick attacks' },
      { name: 'High Set', category: 'Setting', description: 'High, slow sets for timing' },
      { name: 'Jump Set', category: 'Setting', description: 'Setting while jumping' },
      { name: 'Set Consistency', category: 'Setting', description: 'Reliability and repeatability in setting' },
      { name: 'Decision Making', category: 'Setting', description: 'Choosing the best attack option' }
    ];

    // Insert attacking skills
    const attackingSkills = [
      { name: 'Spike Technique', category: 'Attacking', description: 'Basic attacking technique and form' },
      { name: 'Approach Timing', category: 'Attacking', description: 'Timing the approach to the ball' },
      { name: 'Power Attack', category: 'Attacking', description: 'Hard-driven attacks' },
      { name: 'Placement Attack', category: 'Attacking', description: 'Strategic placement of attacks' },
      { name: 'Tool Usage', category: 'Attacking', description: 'Using blockers hands effectively' },
      { name: 'Quick Attack', category: 'Attacking', description: 'Fast-tempo attacking' },
      { name: 'Back Row Attack', category: 'Attacking', description: 'Attacking from behind 10-foot line' },
      { name: 'Slide Attack', category: 'Attacking', description: 'Lateral movement attack (middle)' }
    ];

    // Insert blocking skills
    const blockingSkills = [
      { name: 'Block Timing', category: 'Blocking', description: 'Timing the jump for blocking' },
      { name: 'Block Positioning', category: 'Blocking', description: 'Proper hand and body position' },
      { name: 'Soft Block', category: 'Blocking', description: 'Controlling the ball over the net' },
      { name: 'Hard Block', category: 'Blocking', description: 'Aggressive blocking for kills' },
      { name: 'Double Block', category: 'Blocking', description: 'Coordinated two-person blocking' },
      { name: 'Triple Block', category: 'Blocking', description: 'Three-person blocking coordination' },
      { name: 'Block Coverage', category: 'Blocking', description: 'Transitioning after blocking' }
    ];

    // Insert movement skills
    const movementSkills = [
      { name: 'Court Movement', category: 'Movement', description: 'General agility and court coverage' },
      { name: 'Footwork', category: 'Movement', description: 'Proper foot positioning and movement' },
      { name: 'Balance', category: 'Movement', description: 'Maintaining stability during play' },
      { name: 'Reaction Time', category: 'Movement', description: 'Speed of response to ball movement' },
      { name: 'Transition Speed', category: 'Movement', description: 'Speed between offensive and defensive play' },
      { name: 'Lateral Movement', category: 'Movement', description: 'Side-to-side court movement' }
    ];

    // Insert mental skills
    const mentalSkills = [
      { name: 'Game Awareness', category: 'Mental', description: 'Understanding game situation and strategy' },
      { name: 'Communication', category: 'Mental', description: 'Verbal and non-verbal team communication' },
      { name: 'Focus', category: 'Mental', description: 'Concentration and attention to detail' },
      { name: 'Confidence', category: 'Mental', description: 'Self-assurance in abilities' },
      { name: 'Pressure Handling', category: 'Mental', description: 'Performance under pressure situations' },
      { name: 'Leadership', category: 'Mental', description: 'Leading and motivating teammates' },
      { name: 'Adaptability', category: 'Mental', description: 'Adjusting to changing game conditions' }
    ];

    // Combine all skills
    const allSkills = [
      ...servingSkills,
      ...passingSkills,
      ...settingSkills,
      ...attackingSkills,
      ...blockingSkills,
      ...movementSkills,
      ...mentalSkills
    ];

    // Insert all skills into database
    for (const skill of allSkills) {
      await pool.query(
        'INSERT INTO volleyball_skills (name, category, description) VALUES ($1, $2, $3)',
        [skill.name, skill.category, skill.description]
      );
    }

    console.log(`✅ Successfully populated ${allSkills.length} volleyball skills`);
    console.log('Categories:');
    console.log(`  - Serving: ${servingSkills.length} skills`);
    console.log(`  - Passing: ${passingSkills.length} skills`);
    console.log(`  - Setting: ${settingSkills.length} skills`);
    console.log(`  - Attacking: ${attackingSkills.length} skills`);
    console.log(`  - Blocking: ${blockingSkills.length} skills`);
    console.log(`  - Movement: ${movementSkills.length} skills`);
    console.log(`  - Mental: ${mentalSkills.length} skills`);

  } catch (error) {
    console.error('❌ Error populating volleyball skills:', error);
  }
}

// Run the population if this file is executed directly
if (require.main === module) {
  populateVolleyballSkills().then(() => {
    process.exit(0);
  });
}

module.exports = populateVolleyballSkills;

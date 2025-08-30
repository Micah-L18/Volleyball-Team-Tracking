const express = require('express');
const pool = require('./config/database');

async function testBulkImport() {
    try {
        console.log('🧪 Testing bulk import functionality...\n');

        // Test data - simulating what would come from the frontend
        const testData = {
            team_id: 5, // Assuming team 5 exists
            players: [
                {
                    first_name: 'Alex',
                    last_name: 'Johnson',
                    jersey_number: 77,
                    position: 'setter',
                    year: 'senior',
                    contact_info: 'alex@example.com'
                },
                {
                    first_name: 'Sarah',
                    last_name: 'Williams',
                    jersey_number: 88,
                    position: 'outside_hitter',
                    year: 'junior',
                    height: 72,
                    reach: 90,
                    dominant_hand: 'Right'
                },
                {
                    first_name: 'Mike',
                    last_name: 'Davis',
                    position: 'middle_blocker', // No jersey number - should work
                    year: 'sophomore'
                    // No height/reach - should default to 70/80
                }
            ]
        };

        console.log('📤 Test data:', JSON.stringify(testData, null, 2));

        // Simulate the bulk import logic
        console.log('\n🔄 Processing bulk import...');

        // Check if team exists and user has access (simplified for test)
        const teamCheck = await pool.query('SELECT id FROM team WHERE id = $1', [testData.team_id]);
        if (teamCheck.rows.length === 0) {
            console.log('❌ Team not found');
            return;
        }
        console.log('✅ Team found');

        // Check for duplicate jersey numbers
        const existingJerseys = await pool.query(
            'SELECT jersey_number FROM player WHERE team_id = $1 AND jersey_number IS NOT NULL',
            [testData.team_id]
        );
        const existingJerseyNumbers = new Set(existingJerseys.rows.map(row => row.jersey_number));
        console.log('📝 Existing jersey numbers:', Array.from(existingJerseyNumbers));

        const importJerseyNumbers = new Set();
        const duplicateJerseys = [];
        
        for (const player of testData.players) {
            if (player.jersey_number) {
                if (existingJerseyNumbers.has(player.jersey_number) || importJerseyNumbers.has(player.jersey_number)) {
                    duplicateJerseys.push(player.jersey_number);
                }
                importJerseyNumbers.add(player.jersey_number);
            }
        }

        if (duplicateJerseys.length > 0) {
            console.log('❌ Duplicate jersey numbers found:', duplicateJerseys);
            return;
        }
        console.log('✅ No duplicate jersey numbers');

        // Begin transaction
        await pool.query('BEGIN');

        const importResults = [];
        let successCount = 0;
        let errorCount = 0;

        try {
            for (const playerData of testData.players) {
                try {
                    const {
                        first_name, last_name, position, year, jersey_number, dominant_hand, 
                        contact_info, notes, photo_url
                    } = playerData;

                    // Set default values for height and reach if not provided
                    const height = playerData.height || 70;
                    const reach = playerData.reach || 80;

                    console.log(`\n👤 Creating player: ${first_name} ${last_name || ''}`);
                    console.log(`   - Jersey: ${jersey_number || 'None'}`);
                    console.log(`   - Position: ${position || 'None'}`);
                    console.log(`   - Height: ${height}" (default: 70")`);
                    console.log(`   - Reach: ${reach}" (default: 80")`);

                    const result = await pool.query(`
                        INSERT INTO player (
                            first_name, last_name, position, year, jersey_number, height, reach,
                            dominant_hand, contact_info, notes, photo_url, team_id
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                        RETURNING *, first_name || COALESCE(' ' || last_name, '') as name
                    `, [first_name, last_name, position, year, jersey_number, height, reach,
                        dominant_hand, contact_info, notes, photo_url, testData.team_id]);

                    importResults.push({
                        success: true,
                        player: result.rows[0],
                        originalData: playerData
                    });
                    successCount++;
                    console.log(`   ✅ Created with ID: ${result.rows[0].id}`);

                } catch (playerError) {
                    console.error(`   ❌ Error creating player:`, playerError.message);
                    importResults.push({
                        success: false,
                        error: playerError.message,
                        originalData: playerData
                    });
                    errorCount++;
                }
            }

            // Commit transaction
            await pool.query('COMMIT');
            console.log('\n✅ Transaction committed');

            console.log(`\n📊 IMPORT SUMMARY:`);
            console.log(`   Total: ${testData.players.length}`);
            console.log(`   Successful: ${successCount}`);
            console.log(`   Errors: ${errorCount}`);

            // Show created players
            if (successCount > 0) {
                const newPlayers = await pool.query(
                    'SELECT * FROM player WHERE team_id = $1 ORDER BY created_at DESC LIMIT $2',
                    [testData.team_id, successCount]
                );
                
                console.log('\n👥 Newly created players:');
                newPlayers.rows.forEach(player => {
                    console.log(`   - ${player.first_name} ${player.last_name || ''} (#${player.jersey_number || 'No jersey'}) - ${player.position || 'No position'}`);
                    console.log(`     Height: ${player.height}", Reach: ${player.reach}"`);
                });
            }

        } catch (transactionError) {
            await pool.query('ROLLBACK');
            console.log('❌ Transaction rolled back due to error:', transactionError.message);
        }

        console.log('\n🎉 Bulk import test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await pool.end();
    }
}

testBulkImport();

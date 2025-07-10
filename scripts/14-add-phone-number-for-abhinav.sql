-- Add phone number +14155285669 to Abhinav's account
-- This script will add the phone number as a purchased number

-- First, let's verify the user exists and get their ID
DO $$
DECLARE
    user_id_var UUID;
    phone_exists BOOLEAN := FALSE;
BEGIN
    -- Get Abhinav's user ID
    SELECT id INTO user_id_var 
    FROM public.users 
    WHERE email = 'abhinav.d@blinkdigital.in';
    
    IF user_id_var IS NULL THEN
        RAISE EXCEPTION 'User with email abhinav.d@blinkdigital.in not found';
    END IF;
    
    RAISE NOTICE 'Found user: % with ID: %', 'abhinav.d@blinkdigital.in', user_id_var;
    
    -- Check if phone number already exists
    SELECT EXISTS(
        SELECT 1 FROM phone_numbers 
        WHERE phone_number = '+14155285669'
    ) INTO phone_exists;
    
    IF phone_exists THEN
        RAISE NOTICE 'Phone number +14155285669 already exists, updating ownership...';
        
        -- Update existing phone number to belong to Abhinav
        UPDATE phone_numbers 
        SET 
            user_id = user_id_var,
            status = 'purchased',
            updated_at = NOW()
        WHERE phone_number = '+14155285669';
        
        RAISE NOTICE 'Updated existing phone number ownership';
    ELSE
        RAISE NOTICE 'Adding new phone number +14155285669 for user...';
        
        -- Insert new phone number record
        INSERT INTO phone_numbers (
            id,
            user_id,
            phone_number,
            status,
            area_code,
            city,
            state,
            country,
            type,
            capabilities,
            monthly_cost,
            setup_cost,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            user_id_var,
            '+14155285669',
            'purchased',
            '415',
            'San Francisco',
            'CA',
            'US',
            'local',
            ARRAY['voice', 'sms'],
            15.00,
            0.00,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Successfully added new phone number';
    END IF;
    
    -- Verify the phone number was added/updated correctly
    RAISE NOTICE 'Verification: Phone number details:';
    
    SELECT 
        pn.phone_number,
        pn.status,
        pn.area_code,
        pn.city,
        pn.state,
        u.email as owner_email,
        pn.created_at
    FROM phone_numbers pn
    JOIN public.users u ON pn.user_id = u.id
    WHERE pn.phone_number = '+14155285669';
    
END $$;

-- Final verification query
SELECT 
    'Phone Number Added Successfully' as result,
    pn.phone_number,
    pn.status,
    pn.area_code || ' - ' || pn.city || ', ' || pn.state as location,
    u.email as owner,
    pn.created_at::date as date_added
FROM phone_numbers pn
JOIN public.users u ON pn.user_id = u.id
WHERE pn.phone_number = '+14155285669';

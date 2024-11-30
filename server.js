const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const createPrompt = (setting, size = 10) => {
    return `I want you to generate a 2D 10x10 matrix populated with values 0-${size}. The values represent an element of an environment, like so:

    0: Grass
    1: Flowers
    2: Sand
    3: Rocks for a grassy terrain
    4: Rocks for a sandy terrain
    5: Trees for a grassy terrain
    6: Trees for a sandy terrain
    7: Logs for a grassy terrain
    8: Logs for a sandy terrain
    9: Water
    10: Bomb

    Consider that this 10x10 grid will be used in Unity3D for a game. Each element of this 2D matrix represents a tile that will be replaced in-game based on its number.
    Now, for the prompt "${setting}", generate a 2D matrix with these values 0-${size}. Regardless of what the prompt asks for, make sure the values of the matrix are between 0-${size} ONLY.
    If additional information is not specified about some remaining elements of the matrix, fill it by yourself by correlating it to the prompt. Your response should be only the 10x10 matrix and nothing else. 
    Give it in a JSON string format without indentation under the key "tiles" with the value being the 2D array. DO NOT response with any other text.`;
}

app.post('/openai', async (req, res) => {
    try {
        const { setting } = req.body;
        if (!setting) {
            return res.status(400).json({ error: 'Setting is required' });
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPEN_AI}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [
                    {
                        role: "user",
                        content: createPrompt(setting)
                    }
                ]
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.erro?.message || 'OpenAI API error');
        }

        res.json(JSON.parse(data.choices[0].message.content));
    } catch (error) {
        console.error('OpenAI error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/anthropic', async (req, res) => {
    try {
        const { setting } = req.body;
        if (!setting) {
            return res.status(400).json({ error: 'Setting is required' });
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 1024,
                messages: [
                    {
                        role: "user",
                        content: createPrompt(setting)
                    }
                ]
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error?.message || 'Anthropic API error');
        }

        res.json(JSON.parse(data.content[0].text));
    } catch (error) {
        console.error('Anthropic error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/groq', async (req, res) => {
    try {
        const { setting } = req.body;
        if (!setting) {
            return res.status(400).json({ error: 'Setting is required' });
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ}`
            },
            body: JSON.stringify({
                model: "llama-3.2-90b-vision-preview",
                messages: [
                    {
                        role: "user",
                        content: createPrompt(setting)
                    }
                ]
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error?.message || 'Groq API error');
        }

        res.json(JSON.parse(data.choices[0].message.content));
    } catch (error) {
        console.error('Groq error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})
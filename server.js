const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;
const WINDOW_SIZE = 10; // Define the size of the rolling window

const numberStore = []; // This will store the current numbers in the rolling window

// Fetch numbers from the external API
const fetchNumbers = async (type) => {
  try {
    console.log(`Fetching numbers for type: ${type}`);
    const response = await axios.get(`http://20.244.56.144/test/${type}`, { timeout: 500 });
    console.log('Response data:', response.data);  // Log the entire response to see the data structure
    return response.data.numbers || [];  // Ensure 'numbers' exists, otherwise return empty array
  } catch (error) {
    console.error('Error fetching numbers:', error.message);
    return []; // If there is an error, return an empty array
  }
};

// Calculate the average of numbers in the rolling window
const calculateAverage = (numbers) => {
  if (numbers.length === 0) return 0;  // Avoid division by zero
  const sum = numbers.reduce((acc, num) => acc + num, 0); // Sum all numbers in the array
  return (sum / numbers.length).toFixed(2);  // Return average to 2 decimal places
};

// Handle the GET request to fetch numbers
app.get('/numbers/:type', async (req, res) => {
  const { type } = req.params;
  const validTypes = ['p', 'f', 'e', 'r']; // Valid types for the request

  // If the type is invalid, return a 400 error
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid type. Use p, f, e, or r.' });
  }

  // Save the previous state of the numbers in the rolling window
  const prevState = [...numberStore];

  // Fetch the new numbers from the external API
  const newNumbers = await fetchNumbers(type);

  console.log('New Numbers:', newNumbers);

  // Add new numbers to the rolling window, keeping the window size fixed
  newNumbers.forEach((num) => {
    if (!numberStore.includes(num)) {
      if (numberStore.length >= WINDOW_SIZE) {
        numberStore.shift();  // Remove the oldest number if the window is full
      }
      numberStore.push(num);  // Add the new number to the window
    }
  });

  // Calculate the average of the numbers in the current window
  const average = calculateAverage(numberStore);

  // Prepare the formatted response
  const formattedResponse = {
    windowPrevState: prevState,  // The state of the numbers before the update
    windowCurrState: numberStore,  // The current state of the numbers in the window
    numbers: newNumbers,  // The new numbers fetched from the API
    avg: parseFloat(average),  // The calculated average of the current window
  };

  console.log('Formatted Response:', formattedResponse);  // Log the response to check the output

  // Return the formatted response as JSON
  res.json(formattedResponse);
});

// Start the server on the specified port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

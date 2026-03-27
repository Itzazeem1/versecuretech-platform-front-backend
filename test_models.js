const key = 'AIzaSyDhKcnVTOTGzouiRfvFRkkoE75hW-HuaJs';
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
  .then(res => res.json())
  .then(data => {
    if (data.models) {
      console.log('Available Models:', data.models.map(m => m.name).join(', '));
    } else {
      console.log('Data:', data);
    }
  })
  .catch(console.error);

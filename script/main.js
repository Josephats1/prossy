  // Currency conversion settings
        let exchangeRates = {
            USD: 1,
            UGX: 3700, // Initial approximate rate (will be updated from API)
            EUR: 0.85  // Initial approximate rate (will be updated from API)
        };
        
        let currentCurrency = 'UGX'; // Default currency
        
        // Function to fetch live exchange rates
        async function fetchExchangeRates() {
            const rateInfo = document.getElementById('exchange-rate-info');
            rateInfo.innerHTML = '<span class="currency-loading"></span>';
            
            try {
                // Using ExchangeRate-API (free tier)
                const response = await fetch('https://open.er-api.com/v6/latest/USD');
                const data = await response.json();
                
                if (data.result === 'success') {
                    exchangeRates.UGX = data.rates.UGX;
                    exchangeRates.EUR = data.rates.EUR;
                    exchangeRates.USD = 1;
                    
                    // Update the rate info text
                    const formattedDate = new Date(data.time_last_update_utc).toLocaleDateString();
                    rateInfo.title = `Rates updated: ${formattedDate}`;
                    rateInfo.innerHTML = '✓';
                    
                    console.log('Exchange rates updated:', exchangeRates);
                    
                    // Update all product prices with live rates
                    updateAllPrices();
                } else {
                    throw new Error('Failed to fetch exchange rates');
                }
            } catch (error) {
                console.error('Error fetching exchange rates:', error);
                rateInfo.title = 'Using approximate exchange rates';
                rateInfo.innerHTML = '~';
                
                // Use approximate rates as fallback
                exchangeRates = {
                    USD: 1,
                    UGX: 3700,
                    EUR: 0.92
                };
                
                updateAllPrices();
            }
        }
        
        // Function to format currency based on selected currency
        function formatCurrency(amount, currency) {
            // Convert amount to selected currency
            const convertedAmount = amount * exchangeRates[currency];
            
            // Format based on currency
            if (currency === 'UGX') {
                // Round to nearest whole number for UGX
                return `UGX ${Math.round(convertedAmount).toLocaleString()}`;
            } else if (currency === 'USD') {
                // Format USD with dollar sign and two decimal places
                return `$${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            } else if (currency === 'EUR') {
                // Format EUR with euro sign and two decimal places
                return `€${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
        }

        // Function to update all product prices
        function updateAllPrices() {
            const productPrices = document.querySelectorAll('.product-price');
            const productOriginalPrices = document.querySelectorAll('.product-original-price');
            
            // Update each product price
            productsData.newArrivals.forEach((product, index) => {
                if (productPrices[index]) {
                    productPrices[index].textContent = formatCurrency(product.price, currentCurrency);
                }
                if (productOriginalPrices[index]) {
                    productOriginalPrices[index].textContent = formatCurrency(product.originalPrice, currentCurrency);
                }
            });
        }

        // Function to display products with current currency
        function displayProducts() {
            const productsGrid = document.getElementById('products-grid');
            
            // Clear existing content
            productsGrid.innerHTML = '';
            
            // Add each product to the grid
            productsData.newArrivals.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                
                // Format prices based on current currency
                const priceFormatted = formatCurrency(product.price, currentCurrency);
                const originalPriceFormatted = formatCurrency(product.originalPrice, currentCurrency);
                
                productCard.innerHTML = `
                    <div class="product-image-container">
                        ${product.discount ? `<div class="product-badge">${product.discount}</div>` : ''}
                        <img src="${product.colors[0].image}" alt="${product.name}" class="product-image" data-product-id="${product.id}">
                    </div>
                    <div class="product-details">
                        <div class="product-brand">${product.brand}</div>
                        <h3 class="product-name">${product.name}</h3>
                        <div class="product-pricing">
                            <span class="product-price">${priceFormatted}</span>
                            <span class="product-original-price">${originalPriceFormatted}</span>
                            <span class="product-discount">${product.discount}</span>
                        </div>
                        <div class="color-options">
                            ${product.colors.map((color, index) => `
                                <div class="color-option ${index === 0 ? 'active' : ''}" 
                                     style="background-color: ${color.code}"
                                     data-product-id="${product.id}"
                                     data-color-index="${index}"
                                     title="${color.name}"></div>
                            `).join('')}
                        </div>
                        <div class="product-actions">
                            <button class="whatsapp-btn" data-product-id="${product.id}">
                                <i class="fab fa-whatsapp"></i> Inquire
                            </button>
                            <button class="wishlist-btn"><i class="far fa-heart"></i></button>
                        </div>
                    </div>
                `;
                
                productsGrid.appendChild(productCard);
            });
            
            // Add event listeners for color options
            document.querySelectorAll('.color-option').forEach(option => {
                option.addEventListener('click', function() {
                    const productId = this.getAttribute('data-product-id');
                    const colorIndex = this.getAttribute('data-color-index');
                    
                    // Remove active class from all color options for this product
                    document.querySelectorAll(`.color-option[data-product-id="${productId}"]`).forEach(opt => {
                        opt.classList.remove('active');
                    });
                    
                    // Add active class to clicked option
                    this.classList.add('active');
                    
                    // Find the product in our data
                    const product = productsData.newArrivals.find(p => p.id == productId);
                    if (product) {
                        // Update the product image
                        const imageElement = document.querySelector(`.product-image[data-product-id="${productId}"]`);
                        imageElement.src = product.colors[colorIndex].image;
                    }
                });
            });
            
            // Add event listeners for wishlist buttons
            document.querySelectorAll('.wishlist-btn').forEach(button => {
                button.addEventListener('click', function() {
                    this.classList.toggle('active');
                    const icon = this.querySelector('i');
                    icon.classList.toggle('far');
                    icon.classList.toggle('fas');
                });
            });
            
            // Add event listeners for WhatsApp buttons
            document.querySelectorAll('.whatsapp-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const productId = this.getAttribute('data-product-id');
                    const product = productsData.newArrivals.find(p => p.id == productId);
                    
                    if (product) {
                        // Get selected color
                        const activeColorOption = document.querySelector(`.color-option.active[data-product-id="${productId}"]`);
                        let colorName = '';
                        if (activeColorOption) {
                            colorName = activeColorOption.getAttribute('title');
                        }
                        
                        // Create WhatsApp message
                        const message = `Hello ProssyFashions! I'm interested in the ${product.name}${colorName ? ' in ' + colorName : ''}. Can you tell me more about this product?`;
                        
                        // Encode message for URL
                        const encodedMessage = encodeURIComponent(message);
                        
                        // Open WhatsApp (replace phone number with actual business number)
                        window.open(`https://wa.me/256752397834?text=${encodedMessage}`, '_blank');
                    }
                });
            });
        }
        
        // Function to handle currency change
        function handleCurrencyChange() {
            const currencySelect = document.getElementById('currency-select');
            currentCurrency = currencySelect.value;
            
            // Update all product prices
            updateAllPrices();
        }
        
        // Initialize the page when DOM is fully loaded
        document.addEventListener('DOMContentLoaded', function() {
            // Set default currency to UGX
            document.getElementById('currency-select').value = 'UGX';
            
            // Fetch live exchange rates
            fetchExchangeRates();
            
            // Display products with default currency
            displayProducts();
            
            // Add event listener for currency change
            document.getElementById('currency-select').addEventListener('change', handleCurrencyChange);
        });
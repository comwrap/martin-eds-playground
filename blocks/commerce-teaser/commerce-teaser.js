import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { renderButton } from '../../components/button/button.js';

export default function decorate(block) {
  const rows = [...block.children];
  const config = {};

  rows.forEach((row, index) => {
    const [key, value] = row.children;
    const keyText = key?.textContent?.trim().toLowerCase() || '';
    
    switch (keyText) {
      case 'image':
        config.image = value?.querySelector('picture') || null;
        if (config.image) {
          moveInstrumentation(value, config.image);
        }
        break;
      case 'title':
        config.title = value?.textContent?.trim() || '';
        break;
      case 'price':
        config.price = value?.textContent?.trim() || '';
        break;
      case 'description':
        config.description = value?.textContent?.trim() || '';
        break;
      case 'link':
        config.link = value?.textContent?.trim() || '';
        break;
      case 'button text':
        config.buttonText = value?.textContent?.trim() || 'Shop Now';
        break;
      case 'image alt':
        config.imageAlt = value?.textContent?.trim() || 'Product Image';
        break;
      default:
        break;
    }
  });

  block.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'commerce-teaser-wrapper';

  const card = document.createElement('div');
  card.className = 'commerce-teaser-card';

  const imageContainer = document.createElement('div');
  imageContainer.className = 'commerce-teaser-image';
  
  if (config.image) {
    const img = config.image.querySelector('img');
    if (img) {
      const optimizedPic = createOptimizedPicture(
        img.src, 
        config.imageAlt || img.alt || 'Product Image', 
        false, 
        [{ width: '750' }]
      );
      moveInstrumentation(config.image, optimizedPic);
      imageContainer.appendChild(optimizedPic);
    }
  } else {
    const placeholderImg = document.createElement('img');
    placeholderImg.src = 'https://via.placeholder.com/400x300/cccccc/666666?text=Product+Image';
    placeholderImg.alt = config.imageAlt || 'Product Image';
    placeholderImg.loading = 'lazy';
    imageContainer.appendChild(placeholderImg);
  }

  const contentContainer = document.createElement('div');
  contentContainer.className = 'commerce-teaser-content';

  if (config.title) {
    const title = document.createElement('h3');
    title.className = 'commerce-teaser-title';
    title.textContent = config.title;
    contentContainer.appendChild(title);
  }

  if (config.price) {
    const price = document.createElement('div');
    price.className = 'commerce-teaser-price';
    price.textContent = config.price;
    price.setAttribute('aria-label', `Price: ${config.price}`);
    contentContainer.appendChild(price);
  }

  if (config.description) {
    const description = document.createElement('p');
    description.className = 'commerce-teaser-description';
    description.textContent = config.description;
    contentContainer.appendChild(description);
  }

  if (config.link && config.buttonText) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'commerce-teaser-button';
    
    const button = renderButton({
      link: config.link,
      label: config.buttonText,
      target: '_blank',
      block: block
    });
    button.classList.add('commerce-teaser-cta');
    buttonContainer.appendChild(button);
    contentContainer.appendChild(buttonContainer);
  }

  if (config.link) {
    const linkWrapper = document.createElement('a');
    linkWrapper.href = config.link;
    linkWrapper.target = '_blank';
    linkWrapper.rel = 'noopener noreferrer';
    linkWrapper.className = 'commerce-teaser-link';
    linkWrapper.setAttribute('aria-label', `View ${config.title || 'product'} details`);
    
    linkWrapper.appendChild(imageContainer);
    linkWrapper.appendChild(contentContainer);
    card.appendChild(linkWrapper);
  } else {
    card.appendChild(imageContainer);
    card.appendChild(contentContainer);
  }

  wrapper.appendChild(card);
  block.appendChild(wrapper);
}
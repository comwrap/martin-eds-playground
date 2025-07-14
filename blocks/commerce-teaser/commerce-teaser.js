import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const [
    imageRow,
    titleRow,
    priceRow,
    descriptionRow,
    linkRow,
    buttonLabelRow,
    targetRow,
  ] = Array.from(block.children);

  const image = imageRow?.querySelector('picture');
  const imageAlt = imageRow?.querySelector('img')?.alt || 'Product Image';
  const title = titleRow?.textContent.trim() || '';
  const price = priceRow?.textContent.trim() || '';
  const description = descriptionRow?.textContent.trim() || '';
  const link = linkRow?.textContent.trim() || '#';
  const buttonLabel = buttonLabelRow?.textContent.trim() || 'Shop Now';
  const target = targetRow?.textContent.trim() || '_blank';

  block.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'commerce-teaser-wrapper';

  const card = document.createElement('div');
  card.className = 'commerce-teaser-card';

  const imageContainer = document.createElement('div');
  imageContainer.className = 'commerce-teaser-image';

  if (image) {
    const img = image.querySelector('img');
    if (img) {
      const optimizedPic = createOptimizedPicture(img.src, imageAlt, false, [{ width: '750' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      imageContainer.appendChild(optimizedPic);
    }
  } else {
    const placeholderImg = document.createElement('img');
    placeholderImg.src = 'https://via.placeholder.com/400x300';
    placeholderImg.alt = 'Product placeholder';
    imageContainer.appendChild(placeholderImg);
  }

  const contentContainer = document.createElement('div');
  contentContainer.className = 'commerce-teaser-content';

  if (title) {
    const titleElement = document.createElement('h3');
    titleElement.className = 'commerce-teaser-title';
    titleElement.textContent = title.substring(0, 60);
    contentContainer.appendChild(titleElement);
  }

  if (price) {
    const priceElement = document.createElement('div');
    priceElement.className = 'commerce-teaser-price';
    priceElement.setAttribute('aria-label', `Price: ${price}`);
    priceElement.textContent = price;
    contentContainer.appendChild(priceElement);
  }

  if (description) {
    const descElement = document.createElement('p');
    descElement.className = 'commerce-teaser-description';
    const truncatedDesc = description.length > 150 
      ? description.substring(0, 150) + '...' 
      : description;
    descElement.textContent = truncatedDesc;
    contentContainer.appendChild(descElement);
  }

  if (buttonLabel) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'commerce-teaser-button-container';
    
    const button = document.createElement('a');
    button.className = 'commerce-teaser-button';
    button.href = link;
    button.textContent = buttonLabel;
    button.setAttribute('aria-label', `${buttonLabel} for ${title}`);
    
    if (target) {
      button.target = target;
      if (target === '_blank') {
        button.setAttribute('rel', 'noopener noreferrer');
      }
    }
    
    buttonContainer.appendChild(button);
    contentContainer.appendChild(buttonContainer);
  }

  if (link && link !== '#') {
    const cardLink = document.createElement('a');
    cardLink.className = 'commerce-teaser-link';
    cardLink.href = link;
    cardLink.setAttribute('aria-label', `View ${title}`);
    
    if (target) {
      cardLink.target = target;
      if (target === '_blank') {
        cardLink.setAttribute('rel', 'noopener noreferrer');
      }
    }
    
    card.appendChild(cardLink);
  }

  card.appendChild(imageContainer);
  card.appendChild(contentContainer);
  wrapper.appendChild(card);
  block.appendChild(wrapper);
}
import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { renderButton } from '../../components/button/button.js';
import { moveClassToTargetedChild } from '../../scripts/utils.js';

export default function decorate(block) {
  // Extract content from block children
  const rows = [...block.children];
  const [
    imageRow,
    titleRow,
    priceRow,
    descriptionRow,
    linkRow,
    linkTargetRow,
    linkLabelRow,
  ] = rows;

  // Parse content from rows
  const imageElement = imageRow?.querySelector('img');
  const title = titleRow?.textContent.trim() || '';
  const price = priceRow?.textContent.trim() || '';
  const description = descriptionRow?.textContent.trim() || '';
  const linkUrl = linkRow?.querySelector('a')?.href || linkRow?.textContent.trim() || '';
  const linkTarget = linkTargetRow?.textContent.trim() || '_blank';
  const linkLabel = linkLabelRow?.textContent.trim() || 'Shop Now';

  // Clear the block content
  block.textContent = '';

  // Create the commerce teaser structure
  const wrapper = document.createElement('div');
  wrapper.className = 'commerce-teaser-wrapper';

  // Create and append image section
  const imageContainer = document.createElement('div');
  imageContainer.className = 'commerce-teaser-image';

  if (imageElement) {
    // Use createOptimizedPicture for responsive images
    const optimizedPicture = createOptimizedPicture(
      imageElement.src,
      imageElement.alt || title,
      false,
      [{ width: '750' }]
    );
    
    // Move instrumentation from original image to new one
    moveInstrumentation(imageElement, optimizedPicture.querySelector('img'));
    imageContainer.appendChild(optimizedPicture);
  } else {
    // Fallback placeholder image
    const placeholderPicture = createOptimizedPicture(
      'https://placehold.co/600x400/cccccc/666666?text=Product+Image',
      'Product placeholder image',
      false,
      [{ width: '750' }]
    );
    imageContainer.appendChild(placeholderPicture);
  }

  // Create content section
  const contentContainer = document.createElement('div');
  contentContainer.className = 'commerce-teaser-content';

  // Add title
  if (title) {
    const titleElement = document.createElement('h3');
    titleElement.className = 'commerce-teaser-title';
    titleElement.textContent = title;
    contentContainer.appendChild(titleElement);
  }

  // Add price
  if (price) {
    const priceElement = document.createElement('p');
    priceElement.className = 'commerce-teaser-price';
    priceElement.textContent = price;
    priceElement.setAttribute('aria-label', `Price: ${price}`);
    contentContainer.appendChild(priceElement);
  }

  // Add description
  if (description) {
    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'commerce-teaser-description';
    descriptionElement.textContent = description;
    contentContainer.appendChild(descriptionElement);
  }

  // Add CTA button
  if (linkUrl) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'commerce-teaser-button';
    
    const button = renderButton({
      link: linkUrl,
      label: linkLabel,
      target: linkTarget,
      block: block,
    });
    
    if (button) {
      moveClassToTargetedChild(block, button);
      buttonContainer.appendChild(button);
      contentContainer.appendChild(buttonContainer);
    }
  }

  // Assemble the structure
  wrapper.appendChild(imageContainer);
  wrapper.appendChild(contentContainer);

  // Add wrapper to block
  block.appendChild(wrapper);

  // Add card behavior class to wrapper for hover effects
  wrapper.classList.add('commerce-teaser-card');

  // Set proper ARIA attributes for accessibility
  wrapper.setAttribute('role', 'region');
  wrapper.setAttribute('aria-label', `Product teaser: ${title}`);

  // Ensure keyboard navigation
  if (linkUrl) {
    wrapper.setAttribute('tabindex', '0');
    wrapper.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const link = wrapper.querySelector('a');
        if (link) link.click();
      }
    });
  }
}
import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { moveClassToTargetedChild } from '../../scripts/utils.js';
import { renderButton } from '../../components/button/button.js';

/**
 * Decorates the commerce teaser block.
 * Expected markup rows order (children of block):
 * 0: Product Title (text)
 * 1: Product Description (rich text)
 * 2: Product Image (picture or image reference)
 * 3: Product Price (text)
 * 4: Link URL (text)
 * 5: CTA Label (text)
 * 6: Link Target (text, optional – defaults to _blank)
 *
 * The function converts the simplistic author-ing markup into the
 * final DOM structure required by the design system.
 *
 * @param {HTMLElement} block The commerce-teaser block element
 */
export default function decorate(block) {
  const rows = Array.from(block.children);

  // Helper to extract plain-text value from a row and then remove the row.
  const extractValue = (index) => {
    const row = rows[index];
    if (!row) return '';
    const value = row.textContent.trim();
    row.remove();
    return value;
  };

  const title = extractValue(0);
  const description = extractValue(1);

  // Image handling
  let optimizedPicture;
  const imgRow = rows[2];
  if (imgRow) {
    const existingPicture = imgRow.querySelector('picture');
    if (existingPicture) {
      const img = existingPicture.querySelector('img');
      const { src, alt } = img || {};
      if (src) {
        optimizedPicture = createOptimizedPicture(src, alt || '', false, [{ width: '750' }]);
        moveInstrumentation(existingPicture, optimizedPicture);
      }
    } else {
      const src = imgRow.textContent.trim();
      if (src) {
        optimizedPicture = createOptimizedPicture(src, '', false, [{ width: '750' }]);
      }
    }
    imgRow.remove();
  }

  const priceRaw = extractValue(3);
  const link = extractValue(4);
  const label = extractValue(5) || 'View Product';
  const target = extractValue(6) || '_blank';

  // Build DOM structure
  const wrapper = document.createElement('div');
  wrapper.className = 'commerce-teaser';

  // Image container
  const imageDiv = document.createElement('div');
  imageDiv.className = 'commerce-teaser-image';

  if (optimizedPicture) {
    imageDiv.appendChild(optimizedPicture);
  } else {
    const placeholder = createOptimizedPicture('https://placehold.co/600x450', title, false, [{ width: '750' }]);
    imageDiv.appendChild(placeholder);
  }

  // Content
  const contentDiv = document.createElement('div');
  contentDiv.className = 'commerce-teaser-content';

  // Title
  if (title) {
    const titleEl = document.createElement('h3');
    titleEl.className = 'commerce-teaser-title';
    titleEl.textContent = title;
    contentDiv.appendChild(titleEl);
  }

  // Price – screen-reader friendly
  if (priceRaw) {
    const priceEl = document.createElement('p');
    priceEl.className = 'commerce-teaser-price';
    priceEl.setAttribute('aria-label', `Price: ${priceRaw}`);
    priceEl.textContent = priceRaw;
    contentDiv.appendChild(priceEl);
  }

  // Description
  if (description) {
    const descEl = document.createElement('p');
    descEl.className = 'commerce-teaser-description';
    descEl.textContent = description;
    contentDiv.appendChild(descEl);
  }

  // CTA Button
  if (link) {
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'commerce-teaser-button';
    buttonDiv.appendChild(renderButton({ link, label, target, block }));
    moveClassToTargetedChild(block, buttonDiv.querySelector('.button'));
    contentDiv.appendChild(buttonDiv);
  }

  wrapper.appendChild(imageDiv);
  wrapper.appendChild(contentDiv);

  block.textContent = '';
  block.appendChild(wrapper);
}


import * as React from 'react';
import { SVGProps, memo } from 'react';

const UploadIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className="Hawkins-Icon Hawkins-Icon-Standard"
    {...props}
  >
    <path fill="none" d="M0 0h24v24H0z"></path>
    <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"></path>
  </svg>
);

export default memo(UploadIcon);

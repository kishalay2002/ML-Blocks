import { Button } from "@mantine/core";
import { ButtonHTMLAttributes } from "react";

export default function RunButton(
  props: ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <Button
      {...props}
      unstyled
      className={`nodrag run-btn${
        props.className ? "" : " " + props.className
      }`}
      p="0">
      <svg
        style={{ width: "12px", height: "12px" }}
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 10 16">
        <path d="M3.414 1A2 2 0 0 0 0 2.414v11.172A2 2 0 0 0 3.414 15L9 9.414a2 2 0 0 0 0-2.828L3.414 1Z" />
      </svg>
    </Button>
  );
}

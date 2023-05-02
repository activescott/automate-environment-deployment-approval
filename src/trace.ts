import * as core from "@actions/core"
import { formatWithOptions } from "node:util"

/* eslint-disable @typescript-eslint/no-explicit-any */
const fmt = (message: string, ...args: any[]): string =>
  formatWithOptions({ compact: true, breakLength: 120 }, message, ...args)

export function debug(message: string, ...args: any[]): void {
  core.debug(fmt(message, ...args))
}

export function notice(message: string, ...args: any[]): void {
  core.notice(fmt(message, ...args))
}

export function info(message: string, ...args: any[]): void {
  core.info(fmt(message, ...args))
}

export function warning(message: string, ...args: any[]): void {
  core.warning(fmt(message, ...args))
}

import Foundation
import AppKit
import CoreGraphics

// Luminance-key cutout: works on dark-backdrop product shots.
// args: input output [softThreshold 0.30] [hardThreshold 0.45]
let args = CommandLine.arguments
guard args.count >= 3 else { exit(64) }
let soft: Float = args.count > 3 ? (Float(args[3]) ?? 0.30) : 0.30
let hard: Float = args.count > 4 ? (Float(args[4]) ?? 0.45) : 0.45

guard let src = NSImage(contentsOfFile: args[1]) else { exit(1) }
var rect = CGRect(origin: .zero, size: src.size)
guard let cg = src.cgImage(forProposedRect: &rect, context: nil, hints: nil) else { exit(2) }
let w = cg.width, h = cg.height
guard let rep = NSBitmapImageRep(
  bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h, bitsPerSample: 8,
  samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
  colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0
) else { exit(3) }
rep.size = src.size
let ctx = CGContext(
  data: rep.bitmapData, width: w, height: h, bitsPerComponent: 8, bytesPerRow: rep.bytesPerRow,
  space: CGColorSpace(name: CGColorSpace.sRGB)!,
  bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
)!
ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))

let data = rep.bitmapData!
var hash: UInt32 = 0
for y in 0..<h {
  for x in 0..<w {
    let i = (y * rep.bytesPerRow) + x * 4
    let r = Float(data[i]), g = Float(data[i+1]), b = Float(data[i+2])
    let lum = r * 0.299 + g * 0.587 + b * 0.114
    if lum <= soft {
      data[i+3] = 0
      hash &+= 1
    } else if lum < hard {
      data[i+3] = UInt8(255.0 * (lum - soft) / (hard - soft))
    } else {
      data[i+3] = 255
    }
  }
}
// near-empty result = threshold too high / bad image
if hash == UInt32(Double(w) * Double(h)) { exit(6) }
guard let out = rep.representation(using: .png, properties: [:]) else { exit(5) }
try out.write(to: URL(fileURLWithPath: args[2]))

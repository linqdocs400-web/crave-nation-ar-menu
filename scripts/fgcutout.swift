import Foundation
import Vision
import CoreImage
import AppKit

guard CommandLine.arguments.count == 3 else { exit(64) }
let input = CommandLine.arguments[1]
let output = CommandLine.arguments[2]

guard let img = CIImage(contentsOf: URL(fileURLWithPath: input)) else {
  FileHandle.standardError.write("load fail\n".data(using: .utf8)!); exit(1)
}
let handler = VNImageRequestHandler(ciImage: img, options: [:])
let req = VNGenerateForegroundInstanceMaskRequest()
do {
  try handler.perform([req])
  guard let res = req.results?.first else {
    FileHandle.standardError.write("no subject\n".data(using: .utf8)!); exit(2)
  }
  let maskedBuf = try res.generateMaskedImage(ofInstances: res.allInstances, from: handler, croppedToInstancesExtent: true)
  let masked = CIImage(cvPixelBuffer: maskedBuf)
  let ctx = CIContext()
  guard let cg = ctx.createCGImage(masked, from: masked.extent) else { exit(4) }
  let rep = NSBitmapImageRep(cgImage: cg)
  guard let data = rep.representation(using: .png, properties: [:]) else { exit(5) }
  try data.write(to: URL(fileURLWithPath: output))
} catch {
  FileHandle.standardError.write("mask fail: \(error)\n".data(using: .utf8)!); exit(3)
}

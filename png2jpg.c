#include <stdio.h>
#include <stdlib.h>
#include <png.h>
#include <jpeglib.h>

int png_to_jpg(const char *input_path, const char *output_path, int quality) {
    FILE *fp = fopen(input_path, "rb");
    if (!fp) {
        fprintf(stderr, "Failed to open %s\n", input_path);
        return 1;
    }

    png_structp png = png_create_read_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
    if (!png) {
        fclose(fp);
        fprintf(stderr, "Failed to create png read struct\n");
        return 1;
    }

    png_infop info = png_create_info_struct(png);
    if (!info) {
        png_destroy_read_struct(&png, NULL, NULL);
        fclose(fp);
        fprintf(stderr, "Failed to create png info struct\n");
        return 1;
    }

    if (setjmp(png_jmpbuf(png))) {
        png_destroy_read_struct(&png, &info, NULL);
        fclose(fp);
        fprintf(stderr, "Error during png processing\n");
        return 1;
    }

    png_init_io(png, fp);
    png_read_info(png, info);

    png_uint_32 width = png_get_image_width(png, info);
    png_uint_32 height = png_get_image_height(png, info);
    png_byte color_type = png_get_color_type(png, info);
    png_byte bit_depth = png_get_bit_depth(png, info);

    if (bit_depth == 16) {
        png_set_strip_16(png);
    }

    if (color_type == PNG_COLOR_TYPE_PALETTE) {
        png_set_palette_to_rgb(png);
    }

    if (color_type == PNG_COLOR_TYPE_GRAY && bit_depth < 8) {
        png_set_expand_gray_1_2_4_to_8(png);
    }

    if (png_get_valid(png, info, PNG_INFO_tRNS)) {
        png_set_tRNS_to_alpha(png);
    }

    if (color_type == PNG_COLOR_TYPE_RGB || color_type == PNG_COLOR_TYPE_GRAY || color_type == PNG_COLOR_TYPE_PALETTE) {
        png_set_filler(png, 0xFF, PNG_FILLER_AFTER);
    }

    if (color_type == PNG_COLOR_TYPE_GRAY || color_type == PNG_COLOR_TYPE_GRAY_ALPHA) {
        png_set_gray_to_rgb(png);
    }

    int passes = png_set_interlace_handling(png);
    png_read_update_info(png, info);

    png_size_t rowbytes = png_get_rowbytes(png, info);
    png_bytep image_data = (png_bytep)malloc(rowbytes * height);
    if (!image_data) {
        png_destroy_read_struct(&png, &info, NULL);
        fclose(fp);
        fprintf(stderr, "Failed to allocate image data\n");
        return 1;
    }

    png_bytep *row_pointers = (png_bytep *)malloc(sizeof(png_bytep) * height);
    if (!row_pointers) {
        free(image_data);
        png_destroy_read_struct(&png, &info, NULL);
        fclose(fp);
        fprintf(stderr, "Failed to allocate row pointers\n");
        return 1;
    }

    for (png_uint_32 y = 0; y < height; y++) {
        row_pointers[y] = image_data + y * rowbytes;
    }

    for (int pass = 0; pass < passes; pass++) {
        png_read_rows(png, row_pointers, NULL, height);
    }

    fclose(fp);
    png_destroy_read_struct(&png, &info, NULL);
    free(row_pointers);

    struct jpeg_compress_struct cinfo;
    struct jpeg_error_mgr jerr;

    cinfo.err = jpeg_std_error(&jerr);
    jpeg_create_compress(&cinfo);

    FILE *outfile = fopen(output_path, "wb");
    if (!outfile) {
        free(image_data);
        fprintf(stderr, "Failed to open %s for writing\n", output_path);
        jpeg_destroy_compress(&cinfo);
        return 1;
    }

    jpeg_stdio_dest(&cinfo, outfile);

    cinfo.image_width = width;
    cinfo.image_height = height;
    cinfo.input_components = 3;
    cinfo.in_color_space = JCS_RGB;

    jpeg_set_defaults(&cinfo);
    jpeg_set_quality(&cinfo, quality, TRUE);

    jpeg_start_compress(&cinfo, TRUE);

    JSAMPROW row_pointer[1];
    int row_stride = width * 3;

    while (cinfo.next_scanline < cinfo.image_height) {
        png_bytep row = image_data + cinfo.next_scanline * rowbytes;
        for (png_uint_32 x = 0; x < width; x++) {
            png_bytep pixel = row + x * 4;
            row[x * 3 + 0] = pixel[0];
            row[x * 3 + 1] = pixel[1];
            row[x * 3 + 2] = pixel[2];
        }
        row_pointer[0] = row;
        jpeg_write_scanlines(&cinfo, row_pointer, 1);
    }

    jpeg_finish_compress(&cinfo);
    fclose(outfile);
    jpeg_destroy_compress(&cinfo);
    free(image_data);

    return 0;
}

int main(int argc, char **argv) {
    if (argc < 3) {
        fprintf(stderr, "Usage: %s input.png output.jpg [quality]\n", argv[0]);
        return 1;
    }
    int quality = 85;
    if (argc >= 4) {
        quality = atoi(argv[3]);
        if (quality < 1) quality = 1;
        if (quality > 100) quality = 100;
    }
    return png_to_jpg(argv[1], argv[2], quality);
}
